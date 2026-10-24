import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListContacts,
  useCreateContact,
  useDeleteContact,
  getListContactsQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

const OFFICIAL_LINES = [
  { number: "180", label: "Central da Mulher", icon: "woman", color: "#dc143c" },
  { number: "190", label: "Polícia Militar", icon: "shield", color: "#1d4ed8" },
  { number: "192", label: "SAMU", icon: "medkit", color: "#dc2626" },
];


interface ContactFormProps {
  title?: string;
  initialValues?: { name: string; phone: string; relationship: string };
  onSave: (data: { name: string; phone: string; relationship: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
  colors: ReturnType<typeof useColors>;
}

function ContactForm({
  title = "Novo Contato",
  initialValues,
  onSave,
  onCancel,
  isLoading,
  colors,
}: ContactFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [relationship, setRelationship] = useState(initialValues?.relationship ?? "");
  const [error, setError] = useState("");

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("55")) {
      return `+${digits}`;
    }
    if (digits.length === 13 && digits.startsWith("55")) {
      return `+${digits}`;
    }
    const trimmed = raw.trim();
    if (trimmed.startsWith("+")) return trimmed;
    return `+${digits}`;
  }

  function handleSave() {
    if (!name.trim() || !phone.trim() || !relationship.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      setError("Formato inválido. Ex: (47) 99999-9999 ou +55 47 99999-9999");
      return;
    }
    setError("");
    const normalized = normalizePhone(phone);
    onSave({ name: name.trim(), phone: normalized, relationship: relationship.trim() });
  }

  const s = StyleSheet.create({
    wrap: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + "40",
    },
    titleRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 16 },
    titleText: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 },
    label: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    error: { color: colors.destructive, fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 12 },
    row: { flexDirection: "row" as const, gap: 10 },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center" as const,
    },
    cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground },
    saveBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center" as const,
    },
    saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  });

  const isEdit = !!initialValues;

  return (
    <View style={s.wrap}>
      <View style={s.titleRow}>
        <Ionicons
          name={isEdit ? "pencil-outline" : "person-add-outline"}
          size={20}
          color={colors.primary}
        />
        <Text style={s.titleText}>{title}</Text>
      </View>
      <Text style={s.label}>Nome</Text>
      <TextInput
        style={s.input}
        placeholder="Nome completo"
        placeholderTextColor={colors.mutedForeground}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        accessibilityLabel="Nome do contato"
      />
      <Text style={s.label}>Telefone (com código do país)</Text>
      <TextInput
        style={s.input}
        placeholder="+55 47 99999-9999"
        placeholderTextColor={colors.mutedForeground}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        accessibilityLabel="Telefone do contato"
      />
      <Text style={s.label}>Grau de Parentesco</Text>
      <TextInput
        style={s.input}
        placeholder="Ex: Mãe, Irmã, Amiga"
        placeholderTextColor={colors.mutedForeground}
        value={relationship}
        onChangeText={setRelationship}
        accessibilityLabel="Grau de parentesco"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.row}>
        <Pressable style={s.cancelBtn} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar">
          <Text style={s.cancelBtnText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={s.saveBtn}
          onPress={handleSave}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? "Salvar alterações" : "Salvar contato"}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.saveBtnText}>{isEdit ? "Salvar Alterações" : "Salvar"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

type ContactData = {
  id: number;
  name: string;
  phone: string;
  relationship: string;
};

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 80;

  const { data: contacts, isLoading } = useListContacts(userId ?? 0, {
    query: { queryKey: getListContactsQueryKey(userId ?? 0), enabled: !!userId },
  });

  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const s = makeStyles(colors, topPad, botPad);

  async function handleAddContact(data: { name: string; phone: string; relationship: string }) {
    if (!userId) return;
    try {
      await createContact.mutateAsync({ userId, data });
      await qc.invalidateQueries({ queryKey: getListContactsQueryKey(userId) });
      setShowForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o contato.");
    }
  }

  async function handleEditContact(data: { name: string; phone: string; relationship: string }) {
    if (!userId || !editingContact) return;
    setEditSaving(true);
    try {
      await deleteContact.mutateAsync({ userId, contactId: editingContact.id });
      await createContact.mutateAsync({ userId, data });
      await qc.invalidateQueries({ queryKey: getListContactsQueryKey(userId) });
      setEditingContact(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "Não foi possível editar o contato.");
    } finally {
      setEditSaving(false);
    }
  }

  function handleDeleteRequest(contactId: number) {
    setConfirmDeleteId(contactId);
  }

  async function handleDeleteConfirm(contactId: number) {
    if (!userId) return;
    try {
      await deleteContact.mutateAsync({ userId, contactId });
      await qc.invalidateQueries({ queryKey: getListContactsQueryKey(userId) });
      setConfirmDeleteId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setConfirmDeleteId(null);
      Alert.alert("Erro", "Não foi possível remover o contato.");
    }
  }

  const canAddMore = (contacts?.length ?? 0) < 5;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.screenTitle}>Contatos</Text>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>CONTATOS DE CONFIANÇA</Text>
        {canAddMore && !showForm && !editingContact && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowForm(true);
            }}
            style={s.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Adicionar contato de confiança"
            accessibilityHint="Abre o formulário para cadastrar um novo contato"
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={s.addBtnText}>Adicionar</Text>
          </Pressable>
        )}
      </View>

      {showForm && (
        <ContactForm
          onSave={handleAddContact}
          onCancel={() => setShowForm(false)}
          isLoading={createContact.isPending}
          colors={colors}
        />
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : contacts && contacts.length > 0 ? (
        contacts.map((contact) => {
          if (editingContact?.id === contact.id) {
            return (
              <ContactForm
                key={`edit-${contact.id}`}
                title="Editar Contato"
                initialValues={editingContact}
                onSave={handleEditContact}
                onCancel={() => setEditingContact(null)}
                isLoading={editSaving}
                colors={colors}
              />
            );
          }

          return (
            <View key={contact.id} style={s.contactCard}>
              <View style={s.contactAvatar}>
                <Text style={s.contactAvatarText}>{contact.name[0].toUpperCase()}</Text>
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactName}>{contact.name}</Text>
                <Text style={s.contactRelation}>{contact.relationship}</Text>
                <Text style={s.contactPhone}>{contact.phone}</Text>
              </View>
              {confirmDeleteId === contact.id ? (
                <View style={s.confirmDeleteRow}>
                  <Text style={s.confirmDeleteText}>Remover {contact.name}?</Text>
                  <View style={s.confirmDeleteBtns}>
                    <Pressable
                      style={s.confirmNo}
                      onPress={() => setConfirmDeleteId(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar remoção"
                    >
                      <Text style={s.confirmNoText}>Não</Text>
                    </Pressable>
                    <Pressable
                      style={s.confirmYes}
                      onPress={() => handleDeleteConfirm(contact.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Confirmar remoção"
                    >
                      <Text style={s.confirmYesText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={s.contactActions}>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                    style={[s.iconBtn, { backgroundColor: `${colors.primary}18` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ligar para ${contact.name}`}
                    accessibilityHint="Abre o discador com o número deste contato"
                  >
                    <Ionicons name="call" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setConfirmDeleteId(null);
                      setShowForm(false);
                      setEditingContact({
                        id: contact.id,
                        name: contact.name,
                        phone: contact.phone,
                        relationship: contact.relationship,
                      });
                    }}
                    style={[s.iconBtn, { backgroundColor: `${colors.primary}18` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar contato ${contact.name}`}
                    accessibilityHint="Abre o formulário de edição para este contato"
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteRequest(contact.id)}
                    style={[s.iconBtn, { backgroundColor: `${colors.destructive}18` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover contato ${contact.name}`}
                    accessibilityHint="Solicita confirmação antes de excluir"
                  >
                    <Ionicons name="trash" size={18} color={colors.destructive} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      ) : (
        !showForm && (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>Nenhum contato cadastrado</Text>
            <Text style={s.emptySub}>
              Adicione até 5 contatos de confiança para acionar em emergências.
            </Text>
          </View>
        )
      )}

      <Text style={s.limitNote}>{contacts?.length ?? 0}/5 contatos cadastrados</Text>

      <Text style={[s.sectionTitle, { marginTop: 28, marginBottom: 12 }]}>LINHAS OFICIAIS DE AJUDA</Text>
      {OFFICIAL_LINES.map((line) => (
        <Pressable
          key={line.number}
          style={({ pressed }) => [s.officialCard, pressed && s.cardPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(`tel:${line.number}`);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Ligar para ${line.label}, número ${line.number}`}
          accessibilityHint="Abre o discador para ligar diretamente"
        >
          <View style={[s.officialIconWrap, { backgroundColor: `${line.color}20` }]}>
            <Ionicons name={line.icon as "shield"} size={22} color={line.color} />
          </View>
          <View style={s.officialInfo}>
            <Text style={s.officialNumber}>{line.number}</Text>
            <Text style={s.officialLabel}>{line.label}</Text>
          </View>
          <View style={[s.callBtn, { backgroundColor: line.color }]}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={s.callBtnText}>Ligar</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, botPad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: topPad + 8, paddingBottom: botPad, paddingHorizontal: 20 },
    screenTitle: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.primary },
    officialCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    cardPressed: { opacity: 0.7 },
    officialIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    officialInfo: { flex: 1 },
    officialNumber: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    officialLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    callBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    callBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    contactAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.primary}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    contactAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.primary },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    contactRelation: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    contactPhone: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
      marginTop: 2,
    },
    contactActions: { flexDirection: "row", gap: 8 },
    confirmDeleteRow: { flex: 1, gap: 8 },
    confirmDeleteText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    confirmDeleteBtns: { flexDirection: "row", gap: 8 },
    confirmNo: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    confirmNoText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    confirmYes: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.destructive,
      alignItems: "center",
    },
    confirmYesText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    emptySub: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 20,
    },
    limitNote: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 16,
    },
  });
}
