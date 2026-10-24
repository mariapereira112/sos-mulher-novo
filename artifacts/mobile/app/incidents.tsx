import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";
import {
  useCreateIncident,
  useListUserIncidents,
  getListUserIncidentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function IncidentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, userName } = useUser();
  const qc = useQueryClient();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [narrative, setNarrative] = useState("");
  const [witnessInput, setWitnessInput] = useState("");
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [audioNote, setAudioNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const createIncident = useCreateIncident();
  const { data: incidents, isLoading } = useListUserIncidents(userId ?? 0, {
    query: {
      queryKey: getListUserIncidentsQueryKey(userId ?? 0),
      enabled: !!userId,
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function addWitness() {
    const trimmed = witnessInput.trim();
    if (!trimmed) return;
    setWitnesses((prev) => [...prev, trimmed]);
    setWitnessInput("");
  }

  function removeWitness(index: number) {
    setWitnesses((prev) => prev.filter((_, i) => i !== index));
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para anexar fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...uris].slice(0, 5));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso à câmera para fotografar.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris((prev) => [...prev, result.assets[0]!.uri].slice(0, 5));
    }
  }

  function removePhoto(index: number) {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = useCallback(async () => {
    if (!userId) return;
    if (!nomeCompleto.trim() || !narrative.trim()) {
      Alert.alert("Atenção", "Nome completo e descrição são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await createIncident.mutateAsync({
        data: {
          userId,
          nomeCompleto: nomeCompleto.trim(),
          cpf: cpf.trim() || undefined,
          narrative: narrative.trim(),
          witnesses,
          attachments: photoUris,
          audioUrl: audioNote.trim() || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getListUserIncidentsQueryKey(userId) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Boletim Registrado",
        "Seu boletim de ocorrência foi registrado com sucesso.",
        [{ text: "OK" }]
      );
      setNomeCompleto("");
      setCpf("");
      setNarrative("");
      setWitnesses([]);
      setPhotoUris([]);
      setAudioNote("");
    } catch {
      Alert.alert("Erro", "Não foi possível registrar o boletim. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [userId, nomeCompleto, cpf, narrative, witnesses, photoUris, audioNote, createIncident, qc]);

  function exportToPdf(inc: {
    id: number;
    nomeCompleto: string;
    cpf?: string | null;
    narrative: string;
    witnesses?: unknown;
    createdAt: string;
  }) {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Exportar PDF",
        "A exportação de PDF está disponível na versão web do aplicativo. Acesse via navegador para imprimir ou salvar o boletim.",
        [{ text: "Entendido" }]
      );
      return;
    }

    const witnessesArr = Array.isArray(inc.witnesses) ? (inc.witnesses as string[]) : [];
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Boletim de Ocorrência Nº ${inc.id}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; max-width: 700px; }
    h1 { color: #e63946; font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 14px; color: #444; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    p, li { font-size: 13px; line-height: 1.7; margin: 4px 0; }
    .badge { display: inline-block; background: #e63946; color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 11px; }
    .meta { color: #777; font-size: 12px; margin-top: 4px; }
    .narrative { background: #f9f9f9; border-left: 4px solid #e63946; padding: 14px; border-radius: 4px; white-space: pre-wrap; font-size: 13px; line-height: 1.8; }
    footer { margin-top: 48px; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
    .print-btn { margin-bottom: 20px; padding: 10px 20px; background: #e63946; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <h1>🛡 SOS Mulher — Boletim de Ocorrência</h1>
  <p class="meta">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <span class="badge">Nº ${inc.id}</span>
  <h2>Dados da Vítima</h2>
  <p><strong>Nome completo:</strong> ${inc.nomeCompleto}</p>
  ${inc.cpf ? `<p><strong>CPF:</strong> ${inc.cpf}</p>` : ""}
  <p><strong>Registrado por:</strong> ${userName ?? "Usuária"}</p>
  <p><strong>Data do registro:</strong> ${new Date(inc.createdAt).toLocaleString("pt-BR")}</p>
  <h2>Descrição do Incidente</h2>
  <div class="narrative">${inc.narrative.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  ${witnessesArr.length > 0 ? `<h2>Testemunhas (${witnessesArr.length})</h2><ul>${witnessesArr.map((w) => `<li>${w}</li>`).join("")}</ul>` : ""}
  <footer>Documento gerado pelo aplicativo SOS Mulher. Para registrar uma ocorrência oficial, apresente este documento na delegacia da mulher mais próxima ou ligue 180.</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      });
    } else {
      Alert.alert("Popup bloqueado", "Permita popups no navegador para exportar o PDF.");
    }
  }

  const s = makeStyles(colors, topPad);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Pressable
            style={s.backBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={s.title}>Boletim de Ocorrência</Text>
        </View>

        <Text style={s.sectionLabel}>DADOS DO BOLETIM</Text>

        <Text style={s.fieldLabel}>Nome Completo *</Text>
        <TextInput
          style={s.input}
          value={nomeCompleto}
          onChangeText={setNomeCompleto}
          placeholder="Nome completo da vítima"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
        />

        <Text style={s.fieldLabel}>CPF</Text>
        <TextInput
          style={s.input}
          value={cpf}
          onChangeText={setCpf}
          placeholder="000.000.000-00"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
        />

        <Text style={s.fieldLabel}>Descrição do Incidente *</Text>
        <TextInput
          style={[s.input, s.textArea]}
          value={narrative}
          onChangeText={setNarrative}
          placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={s.fieldLabel}>Testemunhas</Text>
        <View style={s.witnessRow}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            value={witnessInput}
            onChangeText={setWitnessInput}
            placeholder="Nome da testemunha"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addWitness}
          />
          <Pressable style={s.addBtn} onPress={addWitness}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
        {witnesses.map((w, i) => (
          <View key={i} style={s.witnessChip}>
            <Ionicons name="person" size={14} color={colors.primary} />
            <Text style={s.witnessChipText}>{w}</Text>
            <Pressable onPress={() => removeWitness(i)}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ))}

        <Text style={[s.fieldLabel, { marginTop: 8 }]}>Fotos / Evidências</Text>
        <View style={s.attachRow}>
          <Pressable style={s.attachBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={s.attachBtnText}>Câmera</Text>
          </Pressable>
          <Pressable style={s.attachBtn} onPress={pickPhoto}>
            <Ionicons name="image" size={20} color={colors.primary} />
            <Text style={s.attachBtnText}>Galeria</Text>
          </Pressable>
        </View>
        {photoUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
            {photoUris.map((uri, i) => (
              <View key={i} style={s.photoThumbWrap}>
                <Image source={{ uri }} style={s.photoThumb} />
                <Pressable style={s.photoRemoveBtn} onPress={() => removePhoto(i)}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={[s.fieldLabel, { marginTop: 8 }]}>Nota de Áudio / Observação</Text>
        <TextInput
          style={[s.input, { height: 72, paddingTop: 12 }]}
          value={audioNote}
          onChangeText={setAudioNote}
          placeholder="Descreva detalhes adicionais de áudio ou observações..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={[s.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={s.submitBtnText}>Registrar Boletim</Text>
            </>
          )}
        </Pressable>

        {Array.isArray(incidents) && incidents.length > 0 && (
          <>
            <Text style={s.sectionLabel}>REGISTROS ANTERIORES</Text>
            {incidents.map((inc) => (
              <View key={inc.id} style={s.incidentCard}>
                <View style={s.incidentCardHeader}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <Text style={s.incidentCardTitle}>{inc.nomeCompleto}</Text>
                </View>
                <Text style={s.incidentCardDate}>
                  {new Date(inc.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={s.incidentCardNarrative} numberOfLines={3}>
                  {inc.narrative}
                </Text>
                {Array.isArray(inc.witnesses) && inc.witnesses.length > 0 && (
                  <Text style={s.incidentCardMeta}>
                    {inc.witnesses.length} testemunha{inc.witnesses.length !== 1 ? "s" : ""}
                  </Text>
                )}
                <Pressable
                  style={[s.exportPdfBtn, exporting && { opacity: 0.6 }]}
                  onPress={() => exportToPdf(inc)}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons name="document" size={16} color={colors.primary} />
                      <Text style={s.exportPdfText}>Exportar PDF</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ))}
          </>
        )}

        {isLoading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>, topPad: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingTop: topPad + 8,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 14,
      marginTop: 8,
    },
    fieldLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    textArea: {
      height: 130,
      paddingTop: 13,
    },
    witnessRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    addBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    witnessChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}18`,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
      gap: 10,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    witnessChipText: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
    },
    attachRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    attachBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      backgroundColor: `${colors.primary}12`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    attachBtnText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
    photoScroll: {
      marginBottom: 14,
    },
    photoThumbWrap: {
      marginRight: 10,
      position: "relative",
    },
    photoThumb: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: colors.card,
    },
    photoRemoveBtn: {
      position: "absolute",
      top: -6,
      right: -6,
      backgroundColor: "#e63946",
      borderRadius: 12,
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 8,
      marginBottom: 28,
    },
    submitBtnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 16,
      color: "#fff",
    },
    incidentCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    incidentCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    incidentCardTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    incidentCardDate: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    incidentCardNarrative: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 20,
    },
    incidentCardMeta: {
      marginTop: 8,
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
    },
    exportPdfBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${colors.primary}12`,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      alignSelf: "flex-start",
    },
    exportPdfText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
  });
}
