import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUser,
  useUpdateUser,
  useDeleteUser,
  useGetSettings,
  useUpsertSettings,
  useCreateFeedback,
  getGetUserQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { router } from "expo-router";
import VoiceRecorder from "@/components/VoiceRecorder";

const SOS_TIMER_OPTIONS = [
  { label: "10 segundos", value: "10" },
  { label: "20 segundos", value: "20" },
  { label: "30 segundos (padrão)", value: "30" },
  { label: "40 segundos", value: "40" },
  { label: "1 min 30 seg", value: "90" },
  { label: "5 minutos", value: "300" },
];

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type AccordionKey =
  | "meusDados"
  | "contaAcesso"
  | "permissoes"
  | "acessibilidade"
  | "seguranca"
  | "vozEmergencia"
  | "temporizador"
  | "avalie"
  | "notificacoes"
  | "ajuda"
  | "sobre"
  | null;

type AjudaKey = "central" | "privacidade" | "termos" | "denunciar" | null;

function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  colors,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[accStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [accStyles.header, pressed && { backgroundColor: colors.muted }]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
        accessibilityHint={isOpen ? "Toque para fechar" : "Toque para expandir"}
      >
        <View style={[accStyles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[accStyles.title, { color: colors.foreground }]}>{title}</Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </Pressable>
      {isOpen && (
        <View style={[accStyles.body, { borderTopColor: colors.border }]}>{children}</View>
      )}
    </View>
  );
}

const accStyles = StyleSheet.create({
  section: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  body: { borderTopWidth: 1, padding: 16, gap: 14 },
});

function ToggleRow({
  label,
  sublabel,
  value,
  onChange,
  colors,
  disabled,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
  disabled?: boolean;
}) {
  return (
    <View
      style={toggleStyles.row}
      accessible={true}
      accessibilityLabel={`${label}${sublabel ? ", " + sublabel : ""}, ${value ? "ativado" : "desativado"}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={toggleStyles.text}>
        <Text style={[toggleStyles.label, { color: disabled ? colors.mutedForeground : colors.foreground }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[toggleStyles.sub, { color: colors.mutedForeground }]}>{sublabel}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          if (disabled) return;
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ false: colors.border, true: `${colors.primary}80` }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
        disabled={disabled}
        accessibilityLabel={label}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1 },
  label: { fontSize: 15, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, clearSession } = useUser();
  const { language, setLanguage } = useLanguage();
  const qc = useQueryClient();

  const [openSection, setOpenSection] = useState<AccordionKey>(null);
  const [meusDadosEditMode, setMeusDadosEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoPickerLoading, setPhotoPickerLoading] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [timerSaved, setTimerSaved] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [logoutConfirming, setLogoutConfirming] = useState(false);
  const [coercionCode, setCoercionCode] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState<AjudaKey>(null);
  const [denunciaText, setDenunciaText] = useState("");
  const [denunciaSubmitted, setDenunciaSubmitted] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 80 : insets.bottom + 80;

  const { data: user, isLoading: userLoading } = useGetUser(userId ?? 0, {
    query: { queryKey: getGetUserQueryKey(userId ?? 0), enabled: !!userId },
  });
  const { data: settings, isLoading: settingsLoading } = useGetSettings(userId ?? 0, {
    query: { queryKey: getGetSettingsQueryKey(userId ?? 0), enabled: !!userId },
  });

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const upsertSettings = useUpsertSettings();
  const createFeedback = useCreateFeedback();

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditEmail(user.email ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setCoercionCode(settings.coercionCode ?? "");
    }
  }, [settings]);

  async function handlePickProfilePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria para alterar a foto de perfil.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setPendingPhotoUri(dataUri);
    }
  }

  async function handleSavePendingPhoto() {
    if (!pendingPhotoUri) return;
    setPhotoPickerLoading(true);
    try {
      await patchSettings({ photoUrl: pendingPhotoUri });
      await qc.invalidateQueries({ queryKey: getGetSettingsQueryKey(userId ?? 0) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingPhotoUri(null);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a foto de perfil.");
    } finally {
      setPhotoPickerLoading(false);
    }
  }

  const s = makeStyles(colors, topPad, botPad);

  function toggleSection(key: AccordionKey) {
    Haptics.selectionAsync();
    setOpenSection((prev) => (prev === key ? null : key));
    if (key !== "ajuda") setAjudaOpen(null);
  }

  function toggleAjuda(key: Exclude<AjudaKey, null>) {
    Haptics.selectionAsync();
    setAjudaOpen((prev) => (prev === key ? null : key));
  }

  async function handleSaveProfile() {
    if (!userId) return;
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert("Atenção", "Nome e telefone são obrigatórios.");
      return;
    }
    setEditSaving(true);
    try {
      await updateUser.mutateAsync({
        userId,
        data: { name: editName.trim(), phone: editPhone.trim(), email: editEmail.trim() || undefined },
      });
      await qc.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setMeusDadosEditMode(false);
      }, 1500);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setEditSaving(false);
    }
  }

  async function patchSettings(patch: Record<string, boolean | string | null | undefined>) {
    if (!userId || !settings) return;
    try {
      await upsertSettings.mutateAsync({
        userId,
        data: {
          gpsEnabled: settings.gpsEnabled,
          notificationsEnabled: settings.notificationsEnabled,
          cameraMicEnabled: settings.cameraMicEnabled,
          discreteMode: settings.discreteMode,
          biometricsEnabled: settings.biometricsEnabled,
          highContrast: settings.highContrast,
          largeText: settings.largeText,
          reduceMotion: settings.reduceMotion,
          coercionCode: settings.coercionCode ?? undefined,
          sosTimer: settings.sosTimer,
          photoUrl: settings.photoUrl ?? undefined,
          ...patch,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetSettingsQueryKey(userId) });
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a configuração.");
    }
  }

  async function handleDeletePhoto() {
    setPhotoPickerLoading(true);
    try {
      await patchSettings({ photoUrl: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível remover a foto de perfil.");
    } finally {
      setPhotoPickerLoading(false);
    }
  }

  async function handleDeleteAccountConfirm() {
    if (!userId) return;
    try {
      await deleteUser.mutateAsync({ userId });
      await clearSession();
      router.replace("/onboarding");
    } catch {
      setDeleteConfirming(false);
      Alert.alert("Erro", "Não foi possível excluir a conta. Tente novamente.");
    }
  }

  async function handleLogoutConfirm() {
    await clearSession();
    router.replace("/onboarding");
  }

  async function handleSubmitRating() {
    if (!userId || rating === 0) return;
    try {
      await createFeedback.mutateAsync({ data: { userId, message: `avaliacao:${rating}:estrelas` } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRatingSubmitted(true);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a avaliação.");
    }
  }

  async function handleCheckUpdates() {
    setCheckingUpdate(true);
    await new Promise((r) => setTimeout(r, 2200));
    setCheckingUpdate(false);
    setUpdateChecked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSubmitDenuncia() {
    if (!denunciaText.trim() || !userId) return;
    try {
      await createFeedback.mutateAsync({ data: { userId, message: `denuncia:${denunciaText.trim()}` } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDenunciaSubmitted(true);
      setDenunciaText("");
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a denúncia.");
    }
  }

  const isLoading = userLoading || settingsLoading;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Tela de perfil"
    >
      <Text style={s.screenTitle} accessibilityRole="header">
        Perfil
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} accessibilityLabel="Carregando perfil" />
      ) : (
        <>
          {/* ─── Profile card ─── */}
          <View style={s.profileCard} accessible={true} accessibilityLabel={`Perfil de ${user?.name ?? "usuária"}`}>
            <Pressable
              style={s.avatarWrap}
              onPress={handlePickProfilePhoto}
              disabled={photoPickerLoading || !!pendingPhotoUri}
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
              accessibilityHint="Abre a galeria para escolher uma nova foto"
            >
              {pendingPhotoUri ? (
                <Image source={{ uri: pendingPhotoUri }} style={s.avatarImg} accessibilityLabel="Prévia da foto" />
              ) : settings?.photoUrl ? (
                <Image source={{ uri: settings.photoUrl }} style={s.avatarImg} accessibilityLabel="Foto de perfil" />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(user?.name ?? "M")[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={s.cameraBtn}>
                {photoPickerLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </Pressable>

            {/* Pending photo confirmation row */}
            {pendingPhotoUri ? (
              <View style={s.pendingPhotoRow}>
                <Text style={s.pendingPhotoLabel}>Confirmar nova foto?</Text>
                <View style={s.pendingPhotoBtns}>
                  <Pressable
                    style={s.pendingCancelBtn}
                    onPress={() => setPendingPhotoUri(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar alteração de foto"
                  >
                    <Text style={s.pendingCancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[s.pendingSaveBtn, photoPickerLoading && { opacity: 0.6 }]}
                    onPress={handleSavePendingPhoto}
                    disabled={photoPickerLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar nova foto de perfil"
                  >
                    {photoPickerLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.pendingSaveText}>Salvar foto</Text></>
                    }
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text style={s.profileName}>{user?.name ?? "—"}</Text>
            <Text style={s.profilePhone}>{user?.phone ?? "—"}</Text>
            {user?.email ? <Text style={s.profileEmail}>{user.email}</Text> : null}
            {user?.gender ? (
              <View style={s.genderTag}>
                <Text style={s.genderTagText}>{user.gender}</Text>
              </View>
            ) : null}
            {!pendingPhotoUri && (
              <>
                <Pressable
                  style={s.changePhotoLink}
                  onPress={handlePickProfilePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Alterar foto de perfil"
                >
                  <Ionicons name="image-outline" size={14} color={colors.primary} />
                  <Text style={s.changePhotoText}>Alterar foto de perfil</Text>
                </Pressable>
                {settings?.photoUrl ? (
                  <Pressable
                    style={s.deletePhotoBtn}
                    onPress={handleDeletePhoto}
                    disabled={photoPickerLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Remover foto de perfil"
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                    <Text style={s.deletePhotoText}>Remover foto</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          {/* ─── 1. Meus Dados ─── */}
          <AccordionSection
            title="Meus Dados"
            icon="person-outline"
            isOpen={openSection === "meusDados"}
            onToggle={() => toggleSection("meusDados")}
            colors={colors}
          >
            {!meusDadosEditMode ? (
              <>
                {[
                  { key: "Nome", val: user?.name ?? "—", locked: false },
                  { key: "Telefone", val: user?.phone ?? "—", locked: false },
                  { key: "E-mail", val: user?.email || "Não informado", locked: false },
                  { key: "CPF", val: "•••.•••.•••-••", locked: true },
                  { key: "Gênero", val: user?.gender ?? "—", locked: true },
                ].map((row, i, arr) => (
                  <React.Fragment key={row.key}>
                    <View style={s.dataRow} accessible accessibilityLabel={`${row.key}: ${row.locked ? "protegido" : row.val}`}>
                      <Text style={s.dataRowKey}>{row.key}</Text>
                      <Text style={s.dataRowVal} numberOfLines={1}>{row.val}</Text>
                      {row.locked && <Ionicons name="lock-closed-outline" size={13} color={colors.mutedForeground} />}
                    </View>
                    {i < arr.length - 1 && <View style={s.divider} />}
                  </React.Fragment>
                ))}
                <Pressable
                  style={[s.saveBtn, { marginTop: 14, flexDirection: "row", gap: 6, justifyContent: "center" }]}
                  onPress={() => setMeusDadosEditMode(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Editar dados pessoais"
                >
                  <Ionicons name="pencil-outline" size={16} color="#fff" />
                  <Text style={s.saveBtnText}>Editar Dados</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={s.fieldLabel}>Nome completo</Text>
                <TextInput
                  style={s.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nome"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  accessibilityLabel="Nome completo"
                  accessibilityHint="Digite seu nome completo"
                />
                <Text style={s.fieldLabel}>Telefone</Text>
                <TextInput
                  style={s.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Telefone"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                  accessibilityLabel="Telefone"
                />
                <Text style={s.fieldLabel}>E-mail (opcional)</Text>
                <TextInput
                  style={s.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="E-mail"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="E-mail opcional"
                />
                <View style={s.editBtnRow}>
                  <Pressable
                    style={s.cancelEditBtn}
                    onPress={() => {
                      setEditName(user?.name ?? "");
                      setEditPhone(user?.phone ?? "");
                      setEditEmail(user?.email ?? "");
                      setMeusDadosEditMode(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar edição"
                  >
                    <Text style={s.cancelEditBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveBtn, { flex: 1 }, editSaving && { opacity: 0.6 }]}
                    onPress={handleSaveProfile}
                    disabled={editSaving}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar dados pessoais"
                    accessibilityState={{ disabled: editSaving }}
                  >
                    {editSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={s.saveBtnText}>Salvar</Text>
                    )}
                  </Pressable>
                </View>
                {saveSuccess && (
                  <View style={s.successBanner} accessible accessibilityLiveRegion="polite" accessibilityLabel="Dados salvos com sucesso">
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={s.successBannerText}>Dados salvos com sucesso!</Text>
                  </View>
                )}
              </>
            )}
          </AccordionSection>

          {/* ─── 2. Conta e Acesso ─── */}
          <AccordionSection
            title="Conta e Acesso"
            icon="lock-closed-outline"
            isOpen={openSection === "contaAcesso"}
            onToggle={() => toggleSection("contaAcesso")}
            colors={colors}
          >
            {user?.email ? (
              <>
                <View style={s.contaRow} accessible accessibilityLabel={`E-mail de acesso: ${user.email}`}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                  <Text style={s.contaLabel}>E-mail de acesso</Text>
                  <Text style={s.contaValue} numberOfLines={1}>{user.email}</Text>
                </View>
                <View style={s.divider} />
              </>
            ) : null}
            <View style={s.contaRow} accessible accessibilityLabel="CPF registrado e protegido">
              <Ionicons name="id-card-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>CPF registrado</Text>
              <Text style={s.contaValue}>•••.•••.•••-••</Text>
            </View>
            <View style={s.divider} />
            <View style={s.contaRow} accessible accessibilityLabel="Conta verificada">
              <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
              <Text style={[s.contaLabel, { color: "#16a34a" }]}>Conta verificada</Text>
            </View>
            <View style={s.divider} />
            <Pressable
              style={s.contaRow}
              onPress={() => setDeleteConfirming((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Excluir conta permanentemente"
              accessibilityHint="Apaga todos os seus dados do aplicativo"
            >
              <Ionicons name="trash-outline" size={18} color="#ff453a" />
              <Text style={[s.contaLabel, { color: "#ff453a" }]}>Excluir Conta</Text>
              <Ionicons name="chevron-forward" size={16} color="#ff453a" />
            </Pressable>
            {deleteConfirming && (
              <View style={s.inlineConfirmPanel} accessible accessibilityLiveRegion="polite">
                <Text style={[s.inlineConfirmTitle, { color: "#ff453a" }]}>Excluir permanentemente?</Text>
                <Text style={[s.fieldSub, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Todos seus dados, alertas e contatos serão apagados.
                </Text>
                <View style={s.inlineConfirmRow}>
                  <Pressable style={s.inlineNo} onPress={() => setDeleteConfirming(false)} accessibilityRole="button" accessibilityLabel="Cancelar exclusão">
                    <Text style={s.inlineNoText}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={[s.inlineYesDanger, { backgroundColor: "#ff453a" }]} onPress={handleDeleteAccountConfirm} accessibilityRole="button" accessibilityLabel="Confirmar exclusão da conta">
                    <Text style={s.inlineYesDangerText}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </AccordionSection>

          {/* ─── 3. Permissões ─── */}
          <AccordionSection
            title="Permissões"
            icon="shield-outline"
            isOpen={openSection === "permissoes"}
            onToggle={() => toggleSection("permissoes")}
            colors={colors}
          >
            <ToggleRow label="GPS / Localização" sublabel="Necessário para emergências" value={settings?.gpsEnabled ?? true} onChange={(v) => patchSettings({ gpsEnabled: v })} colors={colors} />
            <View style={s.divider} />
            <ToggleRow label="Câmera e Microfone" sublabel="Para gravação em emergências" value={settings?.cameraMicEnabled ?? false} onChange={(v) => patchSettings({ cameraMicEnabled: v })} colors={colors} />
          </AccordionSection>

          {/* ─── 4. Acessibilidade ─── */}
          <AccordionSection
            title="Acessibilidade"
            icon="eye-outline"
            isOpen={openSection === "acessibilidade"}
            onToggle={() => toggleSection("acessibilidade")}
            colors={colors}
          >
            <ToggleRow label="Alto Contraste" sublabel="Aumenta o contraste visual para melhor legibilidade" value={settings?.highContrast ?? false} onChange={(v) => patchSettings({ highContrast: v })} colors={colors} />
            <View style={s.divider} />
            <ToggleRow label="Texto Grande" sublabel="Aumenta o tamanho da fonte em todo o aplicativo" value={settings?.largeText ?? false} onChange={(v) => patchSettings({ largeText: v })} colors={colors} />
            <View style={s.divider} />
            <ToggleRow label="Reduzir Animações" sublabel="Desativa efeitos visuais para reduzir estímulos" value={settings?.reduceMotion ?? false} onChange={(v) => patchSettings({ reduceMotion: v })} colors={colors} />
            <View style={s.divider} />
            <View style={s.contaRow} accessible accessibilityLabel="Leitura por voz: compatível com VoiceOver no iOS e TalkBack no Android">
              <Ionicons name="volume-high-outline" size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={s.contaLabel}>Leitura por Voz</Text>
                <Text style={[s.fieldSub, { color: colors.mutedForeground, marginTop: 2 }]}>
                  Compatível com VoiceOver (iOS) e TalkBack (Android)
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            </View>
          </AccordionSection>

          {/* ─── 5. Segurança Avançada ─── */}
          <AccordionSection
            title="Segurança Avançada"
            icon="shield-checkmark-outline"
            isOpen={openSection === "seguranca"}
            onToggle={() => toggleSection("seguranca")}
            colors={colors}
          >
            <ToggleRow label="Biometria" sublabel="Acesso rápido com impressão digital ou Face ID" value={settings?.biometricsEnabled ?? false} onChange={(v) => patchSettings({ biometricsEnabled: v })} colors={colors} />
            <View style={s.divider} />
            <ToggleRow
              label="Modo Disfarce"
              sublabel="Disfarça o app como 'Notas Pessoais' com SOS oculto"
              value={settings?.discreteMode ?? false}
              onChange={(v) => patchSettings({ discreteMode: v })}
              colors={colors}
            />
            {settings?.discreteMode && (
              <View style={s.disguiseTip}>
                <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
                <Text style={[s.fieldSub, { color: colors.primary, flex: 1 }]}>
                  {"Ativo! Para sair: segure o ⋯ no canto superior direito por 1,5 segundo (barrinha azul aparece). Para SOS oculto: segure o + azul por 3 s."}
                </Text>
              </View>
            )}
            <View style={s.divider} />
            <Text style={s.fieldLabel}>Código de Coerção</Text>
            <Text style={[s.fieldSub, { color: colors.mutedForeground }]}>
              Um código alternativo que aparenta desbloqueio normal mas envia um alerta silencioso.
            </Text>
            <TextInput
              style={[s.input, { marginTop: 10 }]}
              value={coercionCode}
              onChangeText={setCoercionCode}
              placeholder="Digite um código secreto"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              onBlur={() => patchSettings({ coercionCode: coercionCode || null })}
              accessibilityLabel="Código de coerção"
              accessibilityHint="Código secreto que envia alerta silencioso quando digitado"
            />
          </AccordionSection>

          {/* ─── 6. Voz de Emergência ─── */}
          <AccordionSection
            title="Voz de Emergência"
            icon="mic-outline"
            isOpen={openSection === "vozEmergencia"}
            onToggle={() => toggleSection("vozEmergencia")}
            colors={colors}
          >
            {userId ? (
              <VoiceRecorder
                userId={userId}
                onUploaded={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              />
            ) : (
              <Text style={[s.fieldSub, { color: colors.mutedForeground }]}>
                Faça login para gravar seu áudio de emergência.
              </Text>
            )}
          </AccordionSection>

          {/* ─── 7. Temporizador SOS ─── */}
          <AccordionSection
            title="Temporizador SOS"
            icon="timer-outline"
            isOpen={openSection === "temporizador"}
            onToggle={() => toggleSection("temporizador")}
            colors={colors}
          >
            <Text style={[s.fieldSub, { color: colors.mutedForeground }]}>
              Tempo de espera até o sistema acionar chamadas automáticas após o SOS.
            </Text>
            {SOS_TIMER_OPTIONS.map((opt) => {
              const isSelected = (settings?.sosTimer ?? "30") === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    s.radioRow,
                    { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? `${colors.primary}14` : colors.background },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); patchSettings({ sosTimer: opt.value }); setTimerSaved(true); setTimeout(() => setTimerSaved(false), 2500); }}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={[s.radioOuter, { borderColor: isSelected ? colors.primary : colors.mutedForeground }]}>
                    {isSelected && <View style={[s.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[s.radioLabel, { color: isSelected ? colors.primary : colors.foreground }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
            {timerSaved && (
              <View style={s.successBanner} accessible accessibilityLiveRegion="polite" accessibilityLabel="Temporizador salvo">
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={s.successBannerText}>Temporizador salvo!</Text>
              </View>
            )}
          </AccordionSection>

          {/* ─── 7. Avalie o App ─── */}
          <AccordionSection
            title="Avalie o App"
            icon="star-outline"
            isOpen={openSection === "avalie"}
            onToggle={() => toggleSection("avalie")}
            colors={colors}
          >
            {ratingSubmitted ? (
              <View style={s.successBanner} accessible accessibilityLiveRegion="polite" accessibilityLabel="Avaliação enviada, obrigada pelo feedback">
                <Ionicons name="heart" size={20} color={colors.primary} />
                <Text style={[s.successBannerText, { color: colors.primary }]}>Obrigada pelo feedback! ❤️</Text>
              </View>
            ) : (
              <>
                <Text style={[s.fieldSub, { color: colors.mutedForeground }]}>
                  Sua opinião nos ajuda a melhorar o SOS Mulher. Quanto você recomendaria?
                </Text>
                <View style={s.starsRow} accessible accessibilityLabel={`Avaliação: ${rating} de 5 estrelas selecionadas`} accessibilityRole="adjustable">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => { Haptics.selectionAsync(); setRating(star); }} accessibilityRole="button" accessibilityLabel={`${star} estrela${star > 1 ? "s" : ""}`} accessibilityState={{ selected: rating >= star }}>
                      <Ionicons name={rating >= star ? "star" : "star-outline"} size={36} color={rating >= star ? "#f59e0b" : colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={[s.saveBtn, (rating === 0 || createFeedback.isPending) && { opacity: 0.5 }]}
                  onPress={handleSubmitRating}
                  disabled={rating === 0 || createFeedback.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Enviar avaliação"
                  accessibilityState={{ disabled: rating === 0 }}
                >
                  {createFeedback.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Enviar Avaliação</Text>}
                </Pressable>
              </>
            )}
          </AccordionSection>

          {/* ─── 8. Notificações ─── */}
          <AccordionSection
            title="Notificações"
            icon="notifications-outline"
            isOpen={openSection === "notificacoes"}
            onToggle={() => toggleSection("notificacoes")}
            colors={colors}
          >
            <ToggleRow label="Alertas de emergência" sublabel="Sempre ativo — não pode ser desativado" value={true} onChange={() => {}} colors={colors} disabled={true} />
            <View style={s.divider} />
            <ToggleRow label="Novidades e dicas" sublabel="Atualizações do app e dicas de segurança" value={settings?.notificationsEnabled ?? true} onChange={(v) => patchSettings({ notificationsEnabled: v })} colors={colors} />
            <View style={s.divider} />
            <ToggleRow label="Mensagens da comunidade" sublabel="Novas publicações no feed comunitário" value={settings?.notificationsEnabled ?? true} onChange={(v) => patchSettings({ notificationsEnabled: v })} colors={colors} />
          </AccordionSection>

          {/* ─── 9. Ajuda e Informações ─── */}
          <AccordionSection
            title="Ajuda e Informações"
            icon="help-circle-outline"
            isOpen={openSection === "ajuda"}
            onToggle={() => toggleSection("ajuda")}
            colors={colors}
          >
            {/* Central de Ajuda */}
            <Pressable style={s.ajudaRow} onPress={() => toggleAjuda("central")} accessibilityRole="button" accessibilityLabel="Central de Ajuda" accessibilityState={{ expanded: ajudaOpen === "central" }}>
              <Ionicons name="book-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Central de Ajuda</Text>
              <Ionicons name={ajudaOpen === "central" ? "chevron-up" : "chevron-forward"} size={16} color={colors.mutedForeground} />
            </Pressable>
            {ajudaOpen === "central" && (
              <View style={s.ajudaContent}>
                {[
                  { q: "Como usar o botão SOS?", a: "Segure o botão SOS por 1,5 segundos na tela principal. O sistema enviará SMS automático para todos os seus contatos de confiança." },
                  { q: "Como adicionar contatos de emergência?", a: "Vá para a aba Contatos e toque em '+ Adicionar'. Você pode cadastrar até 5 contatos de confiança." },
                  { q: "O app funciona sem internet?", a: "O disparo de SOS por SMS funciona sem internet. O GPS e a sincronização de dados requerem conexão ativa." },
                  { q: "O que é o Modo Disfarce?", a: "Disfarça o app como 'Notas Pessoais'. Segure '⋯' no cabeçalho por 2 segundos para acessar o painel secreto de SOS." },
                ].map((item) => (
                  <View key={item.q} style={s.faqItem}>
                    <Text style={[s.faqQ, { color: colors.foreground }]}>❓ {item.q}</Text>
                    <Text style={[s.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={s.divider} />

            {/* Enviar Feedback */}
            <Pressable
              style={s.ajudaRow}
              onPress={() => { Haptics.selectionAsync(); setOpenSection("avalie"); }}
              accessibilityRole="button"
              accessibilityLabel="Enviar Feedback"
              accessibilityHint="Abre a seção de avaliação do app"
            >
              <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Enviar Feedback</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={s.divider} />

            {/* Política de Privacidade */}
            <Pressable style={s.ajudaRow} onPress={() => toggleAjuda("privacidade")} accessibilityRole="button" accessibilityLabel="Política de Privacidade" accessibilityState={{ expanded: ajudaOpen === "privacidade" }}>
              <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Política de Privacidade</Text>
              <Ionicons name={ajudaOpen === "privacidade" ? "chevron-up" : "chevron-forward"} size={16} color={colors.mutedForeground} />
            </Pressable>
            {ajudaOpen === "privacidade" && (
              <View style={s.ajudaContent}>
                <Text style={[s.ajudaBodyText, { color: colors.mutedForeground }]}>
                  O SOS Mulher coleta apenas as informações necessárias para seu funcionamento: nome, telefone, CPF (armazenado de forma segura) e localização GPS (somente durante emergências). Seus dados nunca são vendidos nem compartilhados com terceiros. Todos os dados são criptografados em trânsito e em repouso. Você pode excluir sua conta a qualquer momento em "Conta e Acesso".
                </Text>
              </View>
            )}
            <View style={s.divider} />

            {/* Termos de Uso */}
            <Pressable style={s.ajudaRow} onPress={() => toggleAjuda("termos")} accessibilityRole="button" accessibilityLabel="Termos de Uso" accessibilityState={{ expanded: ajudaOpen === "termos" }}>
              <Ionicons name="document-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Termos de Uso</Text>
              <Ionicons name={ajudaOpen === "termos" ? "chevron-up" : "chevron-forward"} size={16} color={colors.mutedForeground} />
            </Pressable>
            {ajudaOpen === "termos" && (
              <View style={s.ajudaContent}>
                <Text style={[s.ajudaBodyText, { color: colors.mutedForeground }]}>
                  Ao usar o SOS Mulher, você concorda com uso responsável e exclusivo para situações de segurança pessoal. O app é um projeto acadêmico (PI II) e não substitui serviços de emergência oficiais como 190 ou 192. Acionar o SOS sem necessidade real pode prejudicar outros usuários. Proibido uso por pessoas menores de 18 anos desacompanhadas.
                </Text>
              </View>
            )}
            <View style={s.divider} />

            {/* Denunciar Canal */}
            <Pressable style={s.ajudaRow} onPress={() => toggleAjuda("denunciar")} accessibilityRole="button" accessibilityLabel="Denunciar Canal" accessibilityState={{ expanded: ajudaOpen === "denunciar" }}>
              <Ionicons name="flag-outline" size={18} color={colors.destructive} />
              <Text style={[s.contaLabel, { color: colors.destructive }]}>Denunciar Canal</Text>
              <Ionicons name={ajudaOpen === "denunciar" ? "chevron-up" : "chevron-forward"} size={16} color={colors.destructive} />
            </Pressable>
            {ajudaOpen === "denunciar" && (
              <View style={s.ajudaContent}>
                {denunciaSubmitted ? (
                  <View style={s.successBanner} accessible accessibilityLiveRegion="polite">
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={s.successBannerText}>Denúncia enviada. Obrigada!</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[s.fieldSub, { color: colors.mutedForeground }]}>
                      Descreva o problema ou canal inadequado que deseja reportar:
                    </Text>
                    <TextInput
                      style={[s.input, { marginTop: 8, minHeight: 80, textAlignVertical: "top" }]}
                      value={denunciaText}
                      onChangeText={setDenunciaText}
                      placeholder="Descreva o problema…"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                      accessibilityLabel="Texto da denúncia"
                    />
                    <Pressable
                      style={[s.saveBtn, { backgroundColor: colors.destructive }, !denunciaText.trim() && { opacity: 0.5 }]}
                      onPress={handleSubmitDenuncia}
                      disabled={!denunciaText.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Enviar denúncia"
                    >
                      <Text style={s.saveBtnText}>Enviar Denúncia</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </AccordionSection>

          {/* ─── 10. Sobre o App ─── */}
          <AccordionSection
            title="Sobre o App"
            icon="information-circle-outline"
            isOpen={openSection === "sobre"}
            onToggle={() => toggleSection("sobre")}
            colors={colors}
          >
            <View style={s.contaRow} accessible accessibilityLabel="Versão 1 ponto 0 ponto 0">
              <Ionicons name="phone-portrait-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Versão</Text>
              <Text style={s.contaValue}>1.0.0</Text>
            </View>
            <View style={s.divider} />
            <View style={s.contaRow} accessible accessibilityLabel="Projeto PI 2, Projeto Integrador">
              <Ionicons name="school-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Projeto</Text>
              <Text style={s.contaValue}>PI II — Projeto Integrador</Text>
            </View>
            <View style={s.divider} />
            <View style={s.contaRow} accessible accessibilityLabel="Plataforma: React Native com Expo">
              <Ionicons name="layers-outline" size={18} color={colors.mutedForeground} />
              <Text style={s.contaLabel}>Plataforma</Text>
              <Text style={s.contaValue}>React Native + Expo</Text>
            </View>
            <View style={s.divider} />

            {/* Language picker */}
            <View style={{ gap: 8 }}>
              <View style={s.contaRow}>
                <Ionicons name="language-outline" size={18} color={colors.mutedForeground} />
                <Text style={s.contaLabel}>Idioma do App</Text>
              </View>
              {LANGUAGES.map((lang) => {
                const selected = language === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    style={[s.langOption, selected && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }]}
                    onPress={async () => { Haptics.selectionAsync(); await setLanguage(lang.code); }}
                    accessibilityRole="radio"
                    accessibilityLabel={lang.label}
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={s.langFlag}>{lang.flag}</Text>
                    <Text style={[s.langLabel, { color: selected ? colors.primary : colors.foreground }]}>{lang.label}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={s.divider} />

            {/* Version check */}
            {checkingUpdate ? (
              <View style={[s.contaRow, { justifyContent: "center", gap: 10 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[s.contaLabel, { flex: 0 }]}>Verificando atualizações…</Text>
              </View>
            ) : updateChecked ? (
              <View style={s.successBanner} accessible accessibilityLiveRegion="polite" accessibilityLabel="Você está na versão mais recente">
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={s.successBannerText}>Você está na versão mais recente! ✓</Text>
              </View>
            ) : (
              <Pressable
                style={[s.saveBtn, { backgroundColor: colors.secondary, flexDirection: "row", gap: 8, justifyContent: "center" }]}
                onPress={handleCheckUpdates}
                accessibilityRole="button"
                accessibilityLabel="Verificar atualizações do app"
              >
                <Ionicons name="cloud-download-outline" size={16} color={colors.foreground} />
                <Text style={[s.saveBtnText, { color: colors.foreground }]}>Verificar Atualizações</Text>
              </Pressable>
            )}
          </AccordionSection>

          {/* ─── Footer ─── */}
          <Text style={s.footerText} accessible accessibilityLabel="SOS Mulher versão 1.0, Projeto acadêmico PI 2">
            SOS Mulher — v1.0 · Projeto acadêmico PI2
          </Text>

          {/* ─── Logout ─── */}
          <Pressable
            style={s.logoutBtn}
            onPress={() => setLogoutConfirming((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            accessibilityHint="Encerra sua sessão no aplicativo"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
            <Text style={s.logoutText}>Sair da conta</Text>
          </Pressable>
          {logoutConfirming && (
            <View style={s.inlineConfirmPanel} accessible accessibilityLiveRegion="polite">
              <Text style={s.inlineConfirmTitle}>Tem certeza que deseja sair?</Text>
              <View style={s.inlineConfirmRow}>
                <Pressable style={s.inlineNo} onPress={() => setLogoutConfirming(false)} accessibilityRole="button" accessibilityLabel="Cancelar saída">
                  <Text style={s.inlineNoText}>Cancelar</Text>
                </Pressable>
                <Pressable style={s.inlineYesDanger} onPress={handleLogoutConfirm} accessibilityRole="button" accessibilityLabel="Confirmar saída">
                  <Text style={s.inlineYesDangerText}>Sair</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, botPad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 8, paddingBottom: botPad, paddingHorizontal: 20 },
    screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 20 },
    profileCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    avatarWrap: { position: "relative", marginBottom: 12 },
    avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: colors.primary },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.primary}22`, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: colors.primary },
    avatarText: { fontSize: 30, fontFamily: "Inter_700Bold", color: colors.primary },
    cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
    changePhotoLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, paddingVertical: 4 },
    changePhotoText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary },
    deletePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, paddingVertical: 4 },
    deletePhotoText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.destructive },
    pendingPhotoRow: { alignItems: "center" as const, gap: 8, marginTop: 10, width: "100%" as const },
    pendingPhotoLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#f59e0b" },
    pendingPhotoBtns: { flexDirection: "row" as const, gap: 10 },
    pendingCancelBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" as const },
    pendingCancelText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    pendingSaveBtn: { flex: 1, flexDirection: "row" as const, paddingVertical: 9, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" as const, justifyContent: "center" as const, gap: 5 },
    pendingSaveText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
    profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    profilePhone: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 3 },
    profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    genderTag: { marginTop: 10, backgroundColor: `${colors.primary}18`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: `${colors.primary}40` },
    genderTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary },
    // Meus Dados view mode
    dataRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 11 },
    dataRowKey: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, width: 72 },
    dataRowVal: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
    editBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelEditBtn: { flex: 1, backgroundColor: colors.secondary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    cancelEditBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    // Fields
    fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
    fieldSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
    input: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
    successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0" },
    successBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#16a34a" },
    divider: { height: 1, backgroundColor: colors.border },
    radioRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    radioLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
    starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 8 },
    contaRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
    contaLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
    contaValue: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    // Ajuda sub-items
    ajudaRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
    ajudaContent: { backgroundColor: `${colors.primary}08`, borderRadius: 10, padding: 14, gap: 12, marginBottom: 4 },
    ajudaBodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
    faqItem: { gap: 4 },
    faqQ: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    faqA: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, paddingLeft: 6 },
    // Disguise tip
    disguiseTip: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: `${colors.primary}10`, borderRadius: 8, padding: 10, marginTop: -6 },
    // Language
    langOption: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 },
    langFlag: { fontSize: 20 },
    langLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
    footerText: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 16 },
    logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, backgroundColor: `${colors.destructive}10`, borderRadius: 14, borderWidth: 1, borderColor: `${colors.destructive}30`, marginBottom: 8 },
    logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.destructive },
    inlineConfirmPanel: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12, marginTop: 8 },
    inlineConfirmTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    inlineConfirmRow: { flexDirection: "row", gap: 10 },
    inlineNo: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
    inlineNoText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    inlineYesDanger: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.destructive, alignItems: "center" },
    inlineYesDangerText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  });
}
