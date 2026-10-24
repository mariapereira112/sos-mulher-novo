import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useUser } from "@/context/UserContext";
import {
  getGetSettingsQueryKey,
  useCreateAlert,
  useGetSettings,
  useUpsertSettings,
} from "@workspace/api-client-react";

const FAKE_NOTES = [
  {
    id: 1,
    title: "Lista de compras",
    body: "Leite, pão, ovos, iogurte, frutas e legumes para a semana toda. Lembrar de comprar café e aquele sabonete da Natura.",
    preview: "Leite, pão, ovos, iogurte, frutas e legumes para a semana toda",
    date: "Hoje, 14:32",
    iconName: "cart-outline" as const,
    accent: "#34c759",
  },
  {
    id: 2,
    title: "Consulta médica",
    body: "Levar carteirinha do plano. Dra. Marina — Rua das Flores, 123, 9h. Perguntar sobre exames de rotina e pedir encaminhamento para ortopedista.",
    preview: "Levar carteirinha do plano. Dra. Marina — Rua das Flores, 123, 9h",
    date: "Ontem, 09:10",
    iconName: "medical-outline" as const,
    accent: "#5e5ce6",
  },
  {
    id: 3,
    title: "Receita de bolo de cenoura",
    body: "3 cenouras médias, 4 ovos, 1 xícara de óleo, 2 xícaras de açúcar, 2 xícaras de farinha, 1 colher de fermento. Bater no liquidificador e assar a 180°C por 40 min.",
    preview: "3 cenouras médias, 4 ovos, 1 xícara de óleo, 2 xícaras de açúcar…",
    date: "3 dias atrás",
    iconName: "restaurant-outline" as const,
    accent: "#ff9f0a",
  },
  {
    id: 4,
    title: "Números importantes",
    body: "Pediatra: (11) 98765-4321\nFarmácia: (11) 91234-5678\nDentista: (11) 97777-3333\nCondomínio: (11) 93456-7890",
    preview: "Pediatra: (11) 98765-4321 · Farmácia: (11) 91234-5678 · Dentista…",
    date: "1 semana atrás",
    iconName: "call-outline" as const,
    accent: "#007aff",
  },
  {
    id: 5,
    title: "Ideias fim de semana",
    body: "Parque com as crianças sábado cedo, cinema à tarde. Almoço na mãe domingo. Levar o bolo. Não esquecer protetor solar!",
    preview: "Parque com as crianças sábado cedo, cinema à tarde, almoço na mãe…",
    date: "2 semanas atrás",
    iconName: "sunny-outline" as const,
    accent: "#ff6b6b",
  },
];

const HOLD_DURATION = 1500;

export default function DisguiseScreen() {
  const { userId } = useUser();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const createAlert = useCreateAlert();
  const upsertSettings = useUpsertSettings();
  const { data: settings } = useGetSettings(userId ?? 0, {
    query: { queryKey: getGetSettingsQueryKey(userId ?? 0), enabled: !!userId },
  });

  const [sosActive, setSosActive] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [expandedNote, setExpandedNote] = useState<number | null>(null);

  // Animated progress for the hold gesture on ⋯
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  // Called when finger goes DOWN — start growing the progress bar
  function startHold() {
    holdProgress.setValue(0);
    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    });
    holdAnim.current.start();
  }

  // Called when finger lifts WITHOUT completing the long press — reset bar
  function cancelHold() {
    holdAnim.current?.stop();
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  // Called by onLongPress after HOLD_DURATION ms (fires before finger lifts)
  function onHoldComplete() {
    holdAnim.current?.stop();
    holdProgress.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowPanel(true);
  }

  async function triggerSOS() {
    if (!userId || sosActive) return;
    setSosActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await createAlert.mutateAsync({
        data: { userId, latitude: null, longitude: null, timerDuration: 30 },
      });
    } catch {
      // SOS sent silently even if network issues
    }
    setTimeout(() => setSosActive(false), 4000);
  }

  async function deactivateDisguise() {
    if (!userId) return;
    setDeactivating(true);
    try {
      await upsertSettings.mutateAsync({
        userId,
        data: {
          gpsEnabled: settings?.gpsEnabled ?? true,
          notificationsEnabled: settings?.notificationsEnabled ?? true,
          cameraMicEnabled: settings?.cameraMicEnabled ?? false,
          discreteMode: false,
          biometricsEnabled: settings?.biometricsEnabled ?? false,
          highContrast: settings?.highContrast ?? false,
          largeText: settings?.largeText ?? false,
          reduceMotion: settings?.reduceMotion ?? false,
          coercionCode: settings?.coercionCode ?? undefined,
          sosTimer: settings?.sosTimer ?? "30",
          photoUrl: settings?.photoUrl ?? undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetSettingsQueryKey(userId) });
      setShowPanel(false);
    } catch {
      setDeactivating(false);
      Alert.alert(
        "Erro",
        "Não foi possível desativar o modo disfarce. Verifique sua conexão e tente novamente.",
        [{ text: "OK" }]
      );
    }
    setDeactivating(false);
  }

  const progressWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[s.root, { paddingTop: topPad, backgroundColor: "#f2f2f7" }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.appIcon}>📓</Text>
          <Text style={s.headerTitle}>Notas Pessoais</Text>
        </View>

        {/* Hold ⋯ for 1.5 s → secret panel. onLongPress fires before finger lifts. */}
        <View style={s.menuWrap}>
          <Pressable
            onPressIn={startHold}
            onPressOut={cancelHold}
            onLongPress={onHoldComplete}
            delayLongPress={HOLD_DURATION}
            style={s.menuBtn}
            accessibilityLabel="Menu"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#1c1c1e" />
          </Pressable>
          {/* Hold progress bar — hidden until pressing */}
          <Animated.View
            style={[
              s.holdBar,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>

      {/* Sync banner (disguised SOS feedback) */}
      {sosActive && (
        <View style={s.syncBanner}>
          <ActivityIndicator size="small" color="#007aff" />
          <Text style={s.syncText}>Sincronizando notas…</Text>
        </View>
      )}

      {/* Fake search bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search" size={14} color="#8e8e93" />
          <Text style={s.searchPlaceholder}>Pesquisar</Text>
        </View>
      </View>

      {/* Notes list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 90, paddingHorizontal: 16 }}
      >
        <Text style={s.sectionLabel}>Recentes</Text>
        {FAKE_NOTES.map((note) => {
          const isExpanded = expandedNote === note.id;
          return (
            <Pressable
              key={note.id}
              style={({ pressed }) => [s.noteCard, pressed && { opacity: 0.82 }]}
              onPress={() => {
                Haptics.selectionAsync();
                setExpandedNote(isExpanded ? null : note.id);
              }}
            >
              <View style={[s.noteIconBox, { backgroundColor: `${note.accent}1a` }]}>
                <Ionicons name={note.iconName} size={20} color={note.accent} />
              </View>
              <View style={s.noteBody}>
                <Text style={s.noteTitle} numberOfLines={1}>{note.title}</Text>
                <Text
                  style={[s.notePreview, isExpanded && s.notePreviewExpanded]}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {isExpanded ? note.body : note.preview}
                </Text>
                {isExpanded && (
                  <Text style={s.noteCollapseHint}>Toque para recolher</Text>
                )}
              </View>
              <View style={s.noteMeta}>
                <Text style={s.noteDate}>{note.date}</Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-forward"}
                  size={13}
                  color="#aeaeb2"
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* FAB — long-press 3 s = silent SOS */}
      <Pressable
        style={[s.fab, { bottom: botPad + 20 }]}
        onPress={() => {
          Haptics.selectionAsync();
        }}
        onLongPress={triggerSOS}
        delayLongPress={3000}
        accessibilityLabel="Nova nota"
        accessibilityHint="Toque para criar uma nota. Segure por 3 segundos para sincronização."
      >
        {sosActive
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name="add" size={30} color="#fff" />
        }
      </Pressable>

      {/* Secret panel overlay */}
      {showPanel && (
        <View style={s.overlay}>
          <View style={s.panel}>
            <Text style={s.panelTitle}>🔒 Modo Seguro</Text>
            <Text style={s.panelSub}>
              Identificação confirmada. Escolha uma ação:
            </Text>

            <Pressable
              style={s.sosPanelBtn}
              onPress={async () => {
                setShowPanel(false);
                await triggerSOS();
              }}
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={s.sosPanelBtnText}>🚨 Acionar SOS Emergência</Text>
            </Pressable>

            <Pressable
              style={[s.deactivateBtn, deactivating && { opacity: 0.6 }]}
              onPress={deactivateDisguise}
              disabled={deactivating}
            >
              {deactivating ? (
                <ActivityIndicator color="#e63946" size="small" />
              ) : (
                <>
                  <Ionicons name="eye-outline" size={18} color="#e63946" />
                  <Text style={s.deactivateBtnText}>Desativar Modo Disfarce</Text>
                </>
              )}
            </Pressable>

            <Pressable style={s.closeBtn} onPress={() => setShowPanel(false)}>
              <Text style={s.closeBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5ea",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  appIcon: { fontSize: 22 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1c1c1e",
  },
  menuWrap: {
    alignItems: "center",
    gap: 4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  holdBar: {
    height: 2,
    backgroundColor: "#007aff",
    borderRadius: 2,
    alignSelf: "flex-start",
    maxWidth: 36,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e8f4ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#c7e0f8",
  },
  syncText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#007aff",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f2f2f7",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e5e5ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#8e8e93",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#8e8e93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  noteIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  noteBody: { flex: 1 },
  noteTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1c1c1e",
    marginBottom: 3,
  },
  notePreview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6c6c70",
    lineHeight: 18,
  },
  notePreviewExpanded: {
    color: "#3a3a3c",
  },
  noteCollapseHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#aeaeb2",
    marginTop: 6,
  },
  noteMeta: {
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  noteDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#aeaeb2",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007aff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  panel: {
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    padding: 24,
    width: "88%",
    maxWidth: 360,
    gap: 12,
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    textAlign: "center",
  },
  panelSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#aeaeb2",
    textAlign: "center",
    marginBottom: 4,
  },
  sosPanelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingVertical: 14,
  },
  sosPanelBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  deactivateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e63946",
  },
  deactivateBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#e63946",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#8e8e93",
  },
});
