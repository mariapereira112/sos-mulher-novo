import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useListContacts,
  getListContactsQueryKey,
  useCreateAlert,
  useResolveAlert,
  useCreateFeedback,
  getListUserAlertsQueryKey,
} from "@workspace/api-client-react";
import { useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";

const SOS_HOLD_DURATION = 700;
const CHECKIN_OPTIONS = ["15 min", "30 min", "1 hora", "2 horas"];

type ActiveAlert = {
  id: number;
  timerDuration: number;
  startedAt: number;
  contacts: { id: number; name: string; phone: string }[];
};

type CheckinActive = {
  until: number;
  label: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function SOSButton({ onActivate, disabled }: { onActivate: () => void; disabled?: boolean }) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const outerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const [activated, setActivated] = useState(false);
  const [holding, setHolding] = useState(false);
  const radarScale = useSharedValue(1);
  const radarOpacity = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    radarScale.value = withRepeat(
      withTiming(1.85, { duration: 1700, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    radarOpacity.value = withRepeat(
      withTiming(0, { duration: 1700, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    setHolding(true);
    progress.value = withTiming(1, { duration: SOS_HOLD_DURATION, easing: Easing.linear });
    scale.value = withSpring(0.92, { damping: 10 });
    outerScale.value = withSpring(1.08, { damping: 8 });
    glowOpacity.value = withTiming(1, { duration: SOS_HOLD_DURATION });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    setHolding(false);
    progress.value = withTiming(0, { duration: 300 });
    scale.value = withSpring(1);
    outerScale.value = withSpring(1);
    glowOpacity.value = withTiming(0.4, { duration: 300 });
  }, []);

  const handleLongPress = useCallback(() => {
    if (disabled) return;
    setHolding(false);
    setActivated(true);
    progress.value = withTiming(0, { duration: 300 });
    scale.value = withSpring(1);
    outerScale.value = withSpring(1);
    glowOpacity.value = withTiming(0.4, { duration: 300 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    onActivate();
    setTimeout(() => setActivated(false), 2000);
  }, [onActivate, disabled]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: outerScale.value * 1.3 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    borderColor: interpolateColor(progress.value, [0, 1], ["#c0152080", "#e63946"]),
    borderWidth: 3 + progress.value * 6,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const radarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: radarScale.value }],
    opacity: radarOpacity.value,
  }));

  return (
    <View
      style={sosStyles.wrapper}
      accessible={true}
      accessibilityLabel="Botão SOS de emergência"
      accessibilityHint="Pressione o botão SOS para enviar um alerta de emergência aos seus contatos"
      accessibilityRole="button"
    >
      <Animated.View style={[sosStyles.glow, glowStyle]} />
      <Animated.View style={[sosStyles.radar, radarStyle]} />
      <Animated.View style={[sosStyles.ring, ringStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={SOS_HOLD_DURATION}
          disabled={disabled}
          android_disableSound
        >
          <Animated.View style={[sosStyles.btn, (activated || holding) && sosStyles.btnActivated, innerStyle]}>
            <Ionicons name="alarm" size={40} color="#fff" />
            <Text style={sosStyles.sosText}>SOS</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
      <Text style={sosStyles.hint}>Pressione o botão para acionar o alerta</Text>
    </View>
  );
}

export default function SOSDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, userName } = useUser();
  const queryClient = useQueryClient();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [checkinActive, setCheckinActive] = useState<CheckinActive | null>(null);
  const [checkinSecsLeft, setCheckinSecsLeft] = useState(0);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPerm, setLocationPerm] = useState<boolean | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: contacts } = useListContacts(userId ?? 0, {
    query: { queryKey: getListContactsQueryKey(userId ?? 0), enabled: !!userId },
  });
  const { data: settings } = useGetSettings(userId ?? 0, {
    query: { queryKey: getGetSettingsQueryKey(userId ?? 0), enabled: !!userId },
  });

  const createAlert = useCreateAlert();
  const resolveAlert = useResolveAlert();
  const createFeedback = useCreateFeedback();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 80 : insets.bottom + 80;

  // Request and watch real-time GPS
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setLocationPerm(granted);
      if (granted) {
        // Grab the first fix immediately so location is available before any updates arrive
        try {
          const first = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });
          setLocation({ lat: first.coords.latitude, lng: first.coords.longitude });
        } catch (_) { /* ignore — watchPosition will still populate */ }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 },
          (loc) => setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
        );
      }
    })();
    return () => { subscription?.remove(); };
  }, []);

  // Check-in countdown
  useEffect(() => {
    if (checkinActive) {
      const remaining = Math.max(0, Math.round((checkinActive.until - Date.now()) / 1000));
      setCheckinSecsLeft(remaining);
      checkinRef.current = setInterval(() => {
        setCheckinSecsLeft((prev) => {
          if (prev <= 1) {
            if (checkinRef.current) clearInterval(checkinRef.current);
            setCheckinActive(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (checkinRef.current) clearInterval(checkinRef.current);
    }
    return () => { if (checkinRef.current) clearInterval(checkinRef.current); };
  }, [checkinActive]);

  // SOS Countdown ticker
  useEffect(() => {
    if (activeAlert) {
      const elapsed = Math.floor((Date.now() - activeAlert.startedAt) / 1000);
      setCountdown(Math.max(0, activeAlert.timerDuration - elapsed));
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [activeAlert]);

  // Guard ref: prevent the timer-expiry side-effects from firing more than once per alert
  const timerFiredRef = useRef(false);
  useEffect(() => { timerFiredRef.current = false; }, [activeAlert?.id]);

  // When countdown reaches zero — backend already handles Phase 2 (voice calls to
  // contacts) and Phase 3 (call to EMERGENCY_DESTINATION_NUMBER) via its own timers.
  // No action needed from the mobile app here.
  useEffect(() => {
    if (countdown === 0 && activeAlert !== null && !timerFiredRef.current) {
      timerFiredRef.current = true;
      // Backend is managing escalation — nothing to do on the client side.
    }
  }, [countdown, activeAlert]);

  const handleSOSActivate = useCallback(async () => {
    if (!userId) return;

    // Parse sosTimer — profile stores seconds ("10","30","90","300").
    // Legacy DB rows may have ms values (>300), convert those back to seconds.
    let raw = parseInt(settings?.sosTimer ?? "30", 10);
    if (isNaN(raw) || raw <= 0) raw = 30;
    // Anything above 300 (5 min) was stored in ms — divide by 1000
    const timerSeconds = raw > 300 ? Math.min(300, Math.round(raw / 1000)) : raw;

    try {
      const alert = await createAlert.mutateAsync({
        data: {
          userId,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          timerDuration: timerSeconds,
        },
      });
      const contactList = Array.isArray(contacts)
        ? contacts.map((c: { id: number; name: string; phone: string }) => c)
        : [];
      setCancelConfirming(false);
      setCancelling(false);
      setActiveAlert({
        id: alert.id,
        timerDuration: timerSeconds,
        startedAt: Date.now(),
        contacts: contactList,
      });
      await queryClient.invalidateQueries({ queryKey: getListUserAlertsQueryKey(userId) });
    } catch {
      Alert.alert("🚨 SOS Ativado!", "Seus contatos estão sendo notificados. Permaneça calma.", [{ text: "OK" }]);
    }
  }, [userId, settings, contacts, createAlert, queryClient, location]);

  // Step-1: show inline confirm panel (no Alert.alert — broken on web)
  const handleCancelPress = useCallback(() => {
    setCancelConfirming(true);
  }, []);

  // Step-2: user confirmed they are safe — call dedicated /cancel endpoint
  // (clearTimeout runs IMMEDIATELY on backend; no Twilio call can fire after this)
  const handleCancelConfirm = useCallback(async () => {
    if (!activeAlert || cancelling) return;
    setCancelling(true);

    let backendOk = false;
    try {
      const domain = process.env["EXPO_PUBLIC_DOMAIN"];
      const base = domain ? `https://${domain}` : "";
      const res = await fetch(`${base}/api/alerts/${activeAlert.id}/cancel`, { method: "POST" });
      backendOk = res.ok;
      if (backendOk) {
        await queryClient.invalidateQueries({ queryKey: getListUserAlertsQueryKey(userId ?? 0) });
      }
    } catch { /* network error — still clear local state below */ }

    // Always clear local alert state so user isn't stuck on the overlay.
    // If backend call failed, warn without blocking the UI.
    if (countdownRef.current) clearInterval(countdownRef.current);
    setActiveAlert(null);
    setCancelConfirming(false);
    setCancelling(false);

    if (backendOk) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Show brief warning — contacts may still receive the call
      Alert.alert(
        "Alerta cancelado localmente",
        "Não foi possível confirmar o cancelamento com o servidor. Se receber ligações dos seus contatos, informe que está segura.",
        [{ text: "OK" }]
      );
    }
  }, [activeAlert, cancelling, queryClient, userId]);

  function parseDurationMs(label: string): number {
    const hours = label.includes("hora") ? parseInt(label) : 0;
    const mins = !label.includes("hora") ? parseInt(label) : 0;
    return (hours * 3600 + mins * 60) * 1000;
  }

  const handleCheckin = useCallback(async (duration: string) => {
    if (!userId) return;
    try {
      await createFeedback.mutateAsync({ data: { userId, message: `check-in:safe:${duration}` } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const ms = parseDurationMs(duration);
      setCheckinActive({ until: Date.now() + ms, label: duration });
      setCheckinOpen(true);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o check-in.");
    }
  }, [userId, createFeedback]);

  const gpsActive = locationPerm === true;
  const contactCount = Array.isArray(contacts) ? contacts.length : 0;
  const firstName = userName?.split(" ")[0] ?? "Maria";

  // ─── ACTIVE ALERT OVERLAY ───────────────────────────────────────────────────
  if (activeAlert) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: botPad, paddingHorizontal: 20 }}
      >
        {/* SOS indicator */}
        <View style={activeStyles.sosTop}>
          <View style={activeStyles.sosCircle}>
            <Ionicons name="alarm" size={36} color="#fff" />
            <Text style={activeStyles.sosCircleText}>SOS</Text>
          </View>
        </View>

        <Text style={activeStyles.subtitle}>
          Contagem regressiva — polícia será chamada automaticamente
        </Text>

        {/* ── Inline cancel confirmation ───────────────────────── */}
        {cancelConfirming ? (
          <View style={activeStyles.confirmPanel}>
            <Text style={activeStyles.confirmTitle}>Você está segura?</Text>
            <Text style={activeStyles.confirmSub}>
              O alerta será encerrado e seus contatos serão informados que você está bem.
            </Text>
            <View style={activeStyles.confirmRow}>
              <Pressable
                style={activeStyles.confirmNo}
                onPress={() => setCancelConfirming(false)}
              >
                <Text style={activeStyles.confirmNoText}>Não, continuar</Text>
              </Pressable>
              <Pressable
                style={[activeStyles.confirmYes, cancelling && { opacity: 0.6 }]}
                onPress={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling
                  ? <Text style={activeStyles.confirmYesText}>Cancelando…</Text>
                  : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={activeStyles.confirmYesText}> Sim, estou segura</Text></>
                }
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── Cancel trigger button ─────────────────────────── */
          <Pressable
            style={activeStyles.cancelBtn}
            onPress={handleCancelPress}
            accessibilityRole="button"
            accessibilityLabel="Cancelar alerta de emergência"
            accessibilityHint="Indica que você está segura e encerra o alerta"
          >
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={activeStyles.cancelBtnText}>Cancelar alerta (estou segura)</Text>
          </Pressable>
        )}

        {/* Countdown */}
        <View
          style={activeStyles.countdownRow}
          accessible={true}
          accessibilityLabel={`Contagem regressiva: ${formatCountdown(countdown)} para acionar a polícia`}
          accessibilityLiveRegion="polite"
        >
          <View style={activeStyles.countdownBadge}>
            <Ionicons name="person" size={14} color="#ff453a" />
            <Text style={activeStyles.countdownLabel}>CHAMANDO POLÍCIA EM BREVE</Text>
          </View>
          <Text style={activeStyles.countdownTimer}>{formatCountdown(countdown)}</Text>
        </View>

        {/* GPS card */}
        <View style={[activeStyles.infoCard, gpsActive ? activeStyles.infoCardGps : activeStyles.infoCardWarn]}>
          <Ionicons name="location" size={20} color={gpsActive ? "#30d158" : "#ff9f0a"} />
          <View style={{ flex: 1 }}>
            <Text style={[activeStyles.infoCardTitle, { color: gpsActive ? "#30d158" : "#ff9f0a" }]}>
              {gpsActive ? "GPS ativo" : "GPS bloqueado"}
            </Text>
            <Text style={activeStyles.infoCardSub}>
              {gpsActive && location
                ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : "Alerta enviado sem localização · Toque para liberar"}
            </Text>
          </View>
          {!gpsActive && <Ionicons name="arrow-forward" size={16} color="#ff9f0a" />}
        </View>

        {/* WhatsApp sent card */}
        <View style={activeStyles.whatsappCard}>
          <Text style={activeStyles.whatsappText}>✅ Alerta enviado por WhatsApp</Text>
        </View>

        {/* Notified contacts */}
        {activeAlert.contacts.length > 0 && (
          <>
            <Text style={activeStyles.notifTitle}>NOTIFICADOS VIA WHATSAPP</Text>
            {activeAlert.contacts.map((c) => (
              <View key={c.id} style={activeStyles.contactRow}>
                <View style={activeStyles.contactAvatar}>
                  <Ionicons name="person" size={16} color="#666" />
                </View>
                <Text style={activeStyles.contactName}>{c.name}</Text>
                <Text style={activeStyles.contactPhone}>{c.phone}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  }

  // ─── NORMAL SOS DASHBOARD ───────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: topPad + 6, paddingBottom: botPad + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Bem-vinda de volta</Text>
          <Text style={s.greeting}>
            Olá, <Text style={{ color: colors.primary }}>{firstName}</Text>
          </Text>
        </View>
        <View style={s.sosBadge}>
          <Ionicons name="alarm" size={11} color="#fff" />
          <Text style={s.sosBadgeText}>SOS MULHER</Text>
        </View>
      </View>

      {/* ── Status row ── */}
      <View style={s.statusRow}>
        <View style={[s.statusChip, gpsActive ? s.chipGps : s.chipWarn]}>
          <Ionicons name="location" size={13} color={gpsActive ? "#30d158" : "#ff9f0a"} />
          <Text style={[s.chipText, { color: gpsActive ? "#30d158" : "#ff9f0a" }]}>
            {gpsActive ? "GPS ativo" : "GPS inativo"}
          </Text>
        </View>
        <View style={[s.statusChip, contactCount > 0 ? s.chipContact : s.chipWarn]}>
          <Ionicons name="people" size={13} color={contactCount > 0 ? "#7c7ce8" : "#ff9f0a"} />
          <Text style={[s.chipText, { color: contactCount > 0 ? "#7c7ce8" : "#ff9f0a" }]}>
            {contactCount === 0
              ? "Sem contatos"
              : `${contactCount} contato${contactCount !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* ── SOS Button — flex:1 faz o botão ocupar todo o espaço entre status e cards ── */}
      <View style={{ flex: 1, justifyContent: "center" }}>
        <SOSButton onActivate={handleSOSActivate} />
      </View>

      {/* ── Cards de ação ── */}
      <View style={s.cardsWrap}>
        {/* Check-in */}
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.cardHeader, pressed && { opacity: 0.75 }]}
            onPress={() => { Haptics.selectionAsync(); setCheckinOpen((v) => !v); }}
            accessibilityRole="button"
            accessibilityLabel="Check-in de segurança"
            accessibilityState={{ expanded: checkinOpen }}
          >
            <View style={s.cardIconWrap}>
              <Ionicons name="shield-checkmark" size={18} color={checkinActive ? "#30d158" : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={1}>Check-in de segurança</Text>
              <Text style={s.cardSub} numberOfLines={1}>
                {checkinActive ? `Ativo — ${checkinActive.label}` : "Informe que você está bem"}
              </Text>
            </View>
            {checkinActive && (
              <View style={s.activeDot} />
            )}
            <Ionicons name={checkinOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>

          {checkinOpen && (
            <View style={s.cardBody}>
              {checkinActive ? (
                <View style={s.checkinCountdownWrap}>
                  <Ionicons name="checkmark-circle" size={32} color="#30d158" />
                  <Text style={s.checkinCountdownLabel}>Você está segura por</Text>
                  <Text style={s.checkinCountdownTimer}>
                    {pad(Math.floor(checkinSecsLeft / 60))}:{pad(checkinSecsLeft % 60)}
                  </Text>
                  <Pressable style={s.checkinCancelBtn} onPress={() => setCheckinActive(null)}>
                    <Ionicons name="close-circle-outline" size={15} color="#8e8e93" />
                    <Text style={s.checkinCancelText}>Cancelar check-in</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={s.cardBodySub}>
                    Seus contatos serão notificados que você está bem.
                  </Text>
                  <View style={s.checkinGrid}>
                    {CHECKIN_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt}
                        style={({ pressed }) => [s.checkinBtn, pressed && { opacity: 0.7 }]}
                        onPress={() => handleCheckin(opt)}
                        accessibilityRole="button"
                        accessibilityLabel={`Check-in por ${opt}`}
                      >
                        <Text style={s.checkinBtnText}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* How it works */}
        <Pressable
          style={({ pressed }) => [s.infoRow, pressed && { opacity: 0.7 }]}
          onPress={() => setHowItWorksVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Como funciona o SOS Mulher"
        >
          <Ionicons name="information-circle-outline" size={16} color="#8e8e93" />
          <Text style={s.infoRowText}>Como funciona o SOS Mulher?</Text>
          <Ionicons name="chevron-forward" size={14} color="#48484a" style={{ marginLeft: "auto" }} />
        </Pressable>
      </View>

      {/* How it works modal */}
      <Modal
        visible={howItWorksVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHowItWorksVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={s.modalOverlay} onPress={() => setHowItWorksVisible(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <Ionicons name="shield-checkmark" size={26} color="#e63946" />
              </View>
              <Text style={s.modalTitle}>Como funciona o SOS Mulher?</Text>
            </View>
            {[
              { icon: "hand-left" as const, step: "1", text: "Pressione o botão SOS — uma barra de progresso confirma o acionamento." },
              { icon: "paper-plane" as const, step: "2", text: "Sua localização GPS é enviada via WhatsApp para todos os seus contatos de emergência." },
              { icon: "call" as const, step: "3", text: "Se o temporizador zerar sem resposta, uma chamada automática é feita para o número de emergência." },
              { icon: "checkmark-circle" as const, step: "4", text: "Para encerrar o alerta, toque em 'Estou segura' ou confirme pelo histórico de alertas." },
            ].map((item) => (
              <View key={item.step} style={s.modalStep}>
                <View style={s.modalStepNum}>
                  <Text style={s.modalStepNumText}>{item.step}</Text>
                </View>
                <View style={s.modalStepIcon}>
                  <Ionicons name={item.icon} size={18} color="#e63946" />
                </View>
                <Text style={s.modalStepText}>{item.text}</Text>
              </View>
            ))}
            <Pressable
              style={s.modalCloseBtn}
              onPress={() => setHowItWorksVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={s.modalCloseBtnText}>Entendi</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  // ── Header ──────────────────────────────────────────────────────────────────
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8e8e93", marginBottom: 2, letterSpacing: 0.3 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  sosBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#e63946", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  sosBadgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.4 },

  // ── Status chips ─────────────────────────────────────────────────────────────
  statusRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statusChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1 },
  chipGps: { backgroundColor: "#30d15812", borderColor: "#30d15835" },
  chipContact: { backgroundColor: "#7c7ce812", borderColor: "#7c7ce835" },
  chipWarn: { backgroundColor: "#ff9f0a12", borderColor: "#ff9f0a35" },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // ── Bottom cards ─────────────────────────────────────────────────────────────
  cardsWrap: { gap: 10, marginTop: 4 },
  card: { backgroundColor: "#2c2c2e", borderRadius: 16, borderWidth: 1, borderColor: "#3a3a3c", overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#e6394618", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff", marginBottom: 2 },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8e8e93" },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#30d158", marginRight: 2 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#3a3a3c" },
  cardBodySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8e8e93", marginBottom: 12, lineHeight: 19 },

  // ── Check-in ─────────────────────────────────────────────────────────────────
  checkinGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  checkinBtn: { backgroundColor: "#e6394618", borderRadius: 10, borderWidth: 1, borderColor: "#e6394640", paddingHorizontal: 16, paddingVertical: 9 },
  checkinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#e63946" },
  checkinCountdownWrap: { alignItems: "center", paddingVertical: 6, gap: 4 },
  checkinCountdownLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8e8e93", marginTop: 6 },
  checkinCountdownTimer: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#30d158", letterSpacing: 2 },
  checkinCancelBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#3a3a3c", marginTop: 6 },
  checkinCancelText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8e8e93" },

  // ── Info row ─────────────────────────────────────────────────────────────────
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2c2c2e", borderRadius: 14, borderWidth: 1, borderColor: "#3a3a3c", paddingHorizontal: 14, paddingVertical: 13 },
  infoRowText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#8e8e93" },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#1c1c1e", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#3a3a3c", alignSelf: "center", marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#e6394618", alignItems: "center", justifyContent: "center" },
  modalTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  modalStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalStepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#e63946", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  modalStepNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  modalStepIcon: { width: 28, alignItems: "center", marginTop: 1, flexShrink: 0 },
  modalStepText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#c7c7cc", lineHeight: 21 },
  modalCloseBtn: { backgroundColor: "#e63946", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  modalCloseBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});

const sosStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  glow: {
    position: "absolute",
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor: "#e63946",
  },
  radar: {
    position: "absolute",
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 2,
    borderColor: "#e63946",
  },
  ring: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#c0152080",
  },
  btn: {
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  btnActivated: { backgroundColor: "#ff453a" },
  sosText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 5, textAlign: "center" },
  hint: { marginTop: 14, fontSize: 13, fontFamily: "Inter_400Regular", color: "#8e8e93", textAlign: "center", width: "100%" },
});

const activeStyles = StyleSheet.create({
  sosTop: { alignItems: "center", marginBottom: 12 },
  sosCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  sosCircleText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 4 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", marginBottom: 16, lineHeight: 18 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e63946",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  countdownBadge: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  countdownLabel: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  countdownTimer: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 2 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  infoCardGps: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  infoCardWarn: { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" },
  infoCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  infoCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B" },
  whatsappCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  whatsappText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#15803D" },
  notifTitle: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#94A3B8", letterSpacing: 1, marginBottom: 8 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contactAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  contactName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  contactPhone: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B" },
  confirmPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e63946",
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  confirmTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 6, textAlign: "center" },
  confirmSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#475569", textAlign: "center", marginBottom: 14, lineHeight: 18 },
  confirmRow: { flexDirection: "row", gap: 10 },
  confirmNo: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmNoText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  confirmYes: {
    flex: 1,
    backgroundColor: "#30d158",
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  confirmYesText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
