import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useListUserAlerts,
  useResolveAlert,
  getListUserAlertsQueryKey,
} from "@workspace/api-client-react";

type ContactNotif = {
  contactId: number;
  channel: string;
  responseDigit: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

type AlertWithNotifs = {
  id: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  timerDuration: number | null;
  createdAt: string;
  notifications?: ContactNotif[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dayStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  if (diffDays === 0) return `Hoje, ${time} · há instantes`;
  if (diffDays === 1) return `Ontem, ${time} · há 1 dia`;
  return `${dayStr}, ${time} · há ${diffDays} dias`;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const qc = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [pendingConfirmId, setPendingConfirmId] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 80 : insets.bottom + 80;

  const { data: rawAlerts, isLoading, refetch } = useListUserAlerts(userId ?? 0, {
    query: { queryKey: getListUserAlertsQueryKey(userId ?? 0), enabled: !!userId },
  });
  const alerts = rawAlerts as AlertWithNotifs[] | undefined;

  // Refetch every time this tab comes into focus so new SOS alerts appear immediately
  useFocusEffect(
    useCallback(() => {
      if (userId) refetch();
    }, [userId, refetch])
  );

  const resolveAlert = useResolveAlert();

  const handleSelfConfirm = useCallback((alertId: number) => {
    setPendingConfirmId(alertId);
  }, []);

  const handleConfirmOk = useCallback(async (alertId: number) => {
    setPendingConfirmId(null);
    setConfirmingId(alertId);
    try {
      await resolveAlert.mutateAsync({ alertId });
      await qc.invalidateQueries({ queryKey: getListUserAlertsQueryKey(userId ?? 0) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* best-effort */
    } finally {
      setConfirmingId(null);
    }
  }, [resolveAlert, qc, userId]);

  const alertList = Array.isArray(alerts) ? alerts : [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.headerBg, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Ionicons name="heart" size={12} color="#e63946" style={{ marginRight: 4 }} />
          <Text style={styles.headerLabel}>SEGURANÇA</Text>
        </View>
        <Text style={styles.headerTitle}>Histórico</Text>
        <Text style={styles.headerSub}>Alertas emitidos e quem foi notificado.</Text>
      </View>

      <View style={[styles.content, { paddingBottom: botPad }]}>
        {/* Register Incident Card */}
        <Pressable
          style={styles.incidentCard}
          onPress={() => { Haptics.selectionAsync(); router.push("/incidents"); }}
          accessibilityRole="button"
          accessibilityLabel="Registrar Incidente"
          accessibilityHint="Abre o formulário para documentar o ocorrido e gerar um Boletim de Ocorrência"
        >
          <View style={styles.incidentIconWrap}>
            <Ionicons name="document-text" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.incidentCardTitle}>Registrar Incidente</Text>
            <Text style={styles.incidentCardSub}>Documente o ocorrido para um Boletim de Ocorrência</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        {/* Auto-delete warning */}
        <View style={styles.warningBox}>
          <Ionicons name="trash-outline" size={16} color="#d97706" />
          <Text style={styles.warningText}>
            Registros com mais de <Text style={styles.warningBold}>3 meses</Text> são apagados automaticamente.
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        )}

        {!isLoading && alertList.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum alerta registrado</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Seus alertas SOS aparecerão aqui após o primeiro acionamento.
            </Text>
          </View>
        )}

        {/* Alert cards */}
        <View style={styles.cardList}>
          {alertList.map((alert) => {
            const isResolved = alert.status === "resolved_by_contact" || alert.status === "voice_call_dispatched" || alert.status === "authorities_notified";
            const isCancelled = alert.status === "cancelled";
            const isPending = !isResolved && !isCancelled;
            const isConfirming = confirmingId === alert.id;

            function statusConfig() {
              switch (alert.status) {
                case "resolved_by_contact":
                  return { label: "Confirmado", color: "#16a34a", bg: "#16a34a1a", icon: "checkmark-circle" as const };
                case "voice_call_dispatched":
                case "authorities_notified":
                  return { label: "Encerrado", color: "#16a34a", bg: "#16a34a1a", icon: "shield-checkmark" as const };
                case "sms_sent":
                  return { label: "Alerta Enviado", color: "#0ea5e9", bg: "#0ea5e91a", icon: "chatbubble-ellipses" as const };
                case "calling_cloud":
                  return { label: "Chamada Ativa", color: "#f59e0b", bg: "#f59e0b1a", icon: "call" as const };
                case "cancelled":
                  return { label: "Cancelado", color: "#8e8e93", bg: "#8e8e931a", icon: "close-circle" as const };
                default:
                  return { label: "Pendente", color: "#e63946", bg: "#e639461a", icon: "time" as const };
              }
            }

            const sc = statusConfig();

            return (
              <View key={alert.id} style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Top row: number + status */}
                <View style={styles.alertCardTop}>
                  <View style={styles.alertIdWrap}>
                    <Ionicons name="alarm" size={14} color="#e63946" />
                    <Text style={[styles.alertNum, { color: colors.foreground }]}>Alerta #{alert.id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Ionicons name={sc.icon} size={12} color={sc.color} />
                    <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>

                {/* Date */}
                <Text style={[styles.alertDate, { color: colors.mutedForeground }]}>
                  🕐 {formatDate(alert.createdAt)}
                </Text>

                {/* Details row */}
                <View style={styles.detailsRow}>
                  {alert.latitude != null ? (
                    <View style={styles.detailChip}>
                      <Ionicons name="location" size={12} color="#0ea5e9" />
                      <Text style={[styles.detailChipText, { color: colors.mutedForeground }]}>
                        {alert.latitude.toFixed(4)}, {alert.longitude?.toFixed(4)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.detailChip}>
                      <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailChipText, { color: colors.mutedForeground }]}>Sem localização</Text>
                    </View>
                  )}
                  <View style={styles.detailChip}>
                    <Ionicons name="timer-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.detailChipText, { color: colors.mutedForeground }]}>
                      {alert.timerDuration ?? 30}s temporizador
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

                {/* Per-contact notification status */}
                {(() => {
                  const notifs = alert.notifications ?? [];
                  if (notifs.length === 0) {
                    return (
                      <View style={styles.notifRow}>
                        <Ionicons name="paper-plane" size={13} color="#0ea5e9" />
                        <Text style={[styles.notifRowText, { color: colors.mutedForeground }]}>
                          Alerta enviado para seus contatos de emergência
                        </Text>
                      </View>
                    );
                  }
                  // Group by contactId
                  const byContact = notifs.reduce<Record<number, ContactNotif[]>>((acc, n) => {
                    const key = n.contactId;
                    acc[key] = acc[key] ?? [];
                    acc[key]!.push(n);
                    return acc;
                  }, {});
                  return (
                    <View style={styles.contactsBlock}>
                      <Text style={[styles.contactsBlockLabel, { color: colors.mutedForeground }]}>
                        CONTATOS NOTIFICADOS
                      </Text>
                      {Object.values(byContact).map((rows) => {
                        const first = rows[0]!;
                        const name = first.contactName ?? first.contactPhone ?? `Contato #${first.contactId}`;
                        const whatsapp = rows.find(r => r.channel === "whatsapp");
                        const voice = rows.find(r => r.channel === "voice_call");
                        const responded = voice?.responseDigit === "1";
                        return (
                          <View key={first.contactId} style={[styles.contactRow, { borderColor: colors.border }]}>
                            <View style={styles.contactNameRow}>
                              <Ionicons name="person-circle-outline" size={15} color="#e63946" />
                              <Text style={[styles.contactName, { color: colors.foreground }]}>{name}</Text>
                            </View>
                            <View style={styles.contactStatusRow}>
                              {whatsapp && (
                                <View style={styles.contactStatusChip}>
                                  <Ionicons name="logo-whatsapp" size={12} color="#22c55e" />
                                  <Text style={[styles.contactStatusText, { color: "#22c55e" }]}>WhatsApp</Text>
                                </View>
                              )}
                              {voice && (
                                responded ? (
                                  <View style={styles.contactStatusChip}>
                                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                                    <Text style={[styles.contactStatusText, { color: "#16a34a" }]}>Atendeu</Text>
                                  </View>
                                ) : (
                                  <View style={styles.contactStatusChip}>
                                    <Ionicons name="call-outline" size={12} color="#f59e0b" />
                                    <Text style={[styles.contactStatusText, { color: "#f59e0b" }]}>Ligação enviada</Text>
                                  </View>
                                )
                              )}
                              {!voice && !whatsapp && (
                                <View style={styles.contactStatusChip}>
                                  <Ionicons name="alert-circle-outline" size={12} color={colors.mutedForeground} />
                                  <Text style={[styles.contactStatusText, { color: colors.mutedForeground }]}>Pendente</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}

                {/* Resolved banner */}
                {isResolved && (
                  <View style={styles.resolvedBanner}>
                    <Ionicons name="shield-checkmark" size={15} color="#16a34a" />
                    <Text style={styles.resolvedBannerText}>Situação encerrada com segurança</Text>
                  </View>
                )}

                {/* Cancelled banner */}
                {isCancelled && (
                  <View style={styles.cancelledBanner}>
                    <Ionicons name="close-circle-outline" size={15} color="#8e8e93" />
                    <Text style={styles.cancelledBannerText}>Alerta cancelado pela usuária</Text>
                  </View>
                )}

                {/* Self-confirm flow */}
                {isPending && pendingConfirmId === alert.id ? (
                  <View style={styles.inlineConfirmPanel} accessible={true} accessibilityLiveRegion="polite">
                    <Text style={styles.inlineConfirmTitle}>Confirmar que você está segura?</Text>
                    <View style={styles.inlineConfirmRow}>
                      <Pressable
                        style={[styles.inlineCancelBtn, { borderColor: colors.border }]}
                        onPress={() => setPendingConfirmId(null)}
                        accessibilityRole="button"
                        accessibilityLabel="Cancelar confirmação"
                      >
                        <Text style={[styles.inlineCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.inlineOkBtn, isConfirming && { opacity: 0.6 }]}
                        onPress={() => handleConfirmOk(alert.id)}
                        disabled={isConfirming}
                        accessibilityRole="button"
                        accessibilityLabel="Confirmar que estou segura"
                        accessibilityState={{ disabled: isConfirming }}
                      >
                        {isConfirming
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.inlineOkText}>Confirmar</Text>
                        }
                      </Pressable>
                    </View>
                  </View>
                ) : isPending ? (
                  <Pressable
                    style={[styles.confirmBtn, isConfirming && { opacity: 0.6 }]}
                    onPress={() => handleSelfConfirm(alert.id)}
                    disabled={isConfirming}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar socorro, estou segura"
                    accessibilityHint="Indica que você está bem e resolve o alerta"
                  >
                    {isConfirming ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
                        <Text style={styles.confirmBtnText}>Estou segura — encerrar alerta</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#1c1c1e",
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  headerLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#e63946", letterSpacing: 1.5 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8e8e93" },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    backgroundColor: "#7c3aed",
  },
  incidentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  incidentCardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  incidentCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#2c1f00",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#6b4c00",
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#fbbf24", lineHeight: 19 },
  warningBold: { fontFamily: "Inter_700Bold", color: "#f59e0b" },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  cardList: { gap: 12 },
  alertCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  alertCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  alertIdWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  alertDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailChipText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dividerLine: { height: 1 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  notifRowText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  contactsBlock: { gap: 6 },
  contactsBlockLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 2 },
  contactRow: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  contactNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactName: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  contactStatusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  contactStatusChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  contactStatusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  resolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16a34a18",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16a34a40",
  },
  resolvedBannerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#16a34a" },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8e8e9318",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#8e8e9340",
  },
  cancelledBannerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#8e8e93" },
  inlineConfirmPanel: {
    backgroundColor: "#16a34a10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#16a34a40",
    gap: 10,
  },
  inlineConfirmTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#16a34a", textAlign: "center" },
  inlineConfirmRow: { flexDirection: "row", gap: 10 },
  inlineCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  inlineCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inlineOkBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#16a34a", alignItems: "center" },
  inlineOkText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16a34a12",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#16a34a40",
  },
  confirmBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#16a34a" },
});
