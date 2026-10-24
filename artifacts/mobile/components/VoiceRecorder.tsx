import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type RecordState = "idle" | "recording" | "recorded" | "uploading" | "uploaded" | "error";

interface Props {
  userId: number;
  onUploaded?: (url: string) => void;
}

function getApiUrl(path: string): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  return domain ? `https://${domain}${path}` : path;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export default function VoiceRecorder({ userId, onUploaded }: Props) {
  const colors = useColors();
  const [recState, setRecState] = useState<RecordState>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [micUnavailable, setMicUnavailable] = useState(false);

  // Web refs
  const webBlobRef = useRef<Blob | null>(null);
  const webStopRef = useRef<(() => void) | null>(null);
  const webMimeRef = useRef<string>("audio/webm");
  // Hidden file input ref for web fallback
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Native (expo-av)
  const nativeRecRef = useRef<unknown>(null);
  const nativeUriRef = useRef<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { stopTimer(); }, []);

  // Create hidden file input once on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.style.display = "none";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelected(file);
    };
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => { document.body.removeChild(input); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function handleFileSelected(file: File) {
    setRecState("uploading");
    setErrorMsg("");
    try {
      const audioBase64 = await blobToBase64(file);
      const mimeType = file.type || "audio/mpeg";
      const res = await fetch(getApiUrl("/api/alerts/voice-upload"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, audioBase64, mimeType }),
      });
      if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
      const data = (await res.json()) as { url: string };
      setRecState("uploaded");
      onUploaded?.(data.url);
    } catch (err: unknown) {
      setErrorMsg(String(err));
      setRecState("error");
    }
  }

  async function startRecordingWeb() {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    webMimeRef.current = mimeType;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      webBlobRef.current = new Blob(chunks, { type: mimeType });
      stream.getTracks().forEach((t) => t.stop());
      setRecState("recorded");
      stopTimer();
    };
    recorder.start();
    webStopRef.current = () => recorder.stop();
  }

  async function handleStart() {
    setErrorMsg("");
    setMicUnavailable(false);
    try {
      if (Platform.OS === "web") {
        webBlobRef.current = null;
        await startRecordingWeb();
        setRecState("recording");
        startTimer();
      } else {
        const { Audio } = await import("expo-av");
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Permissão negada", "Permita o acesso ao microfone para gravar seu áudio de emergência.");
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        nativeRecRef.current = recording;
        setRecState("recording");
        startTimer();
      }
    } catch (err: unknown) {
      const msg = String(err);
      // NotFoundError = no microphone available (common in iframe/preview environments)
      if (msg.includes("NotFoundError") || msg.includes("Requested device not found") || msg.includes("NotAllowedError")) {
        setMicUnavailable(true);
      } else {
        setErrorMsg("Erro ao iniciar gravação: " + msg);
        setRecState("error");
      }
    }
  }

  async function handleStop() {
    stopTimer();
    try {
      if (Platform.OS === "web") {
        webStopRef.current?.();
      } else {
        const { Audio } = await import("expo-av");
        const rec = nativeRecRef.current as InstanceType<typeof Audio.Recording> | null;
        if (rec) {
          await rec.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          nativeUriRef.current = rec.getURI() ?? null;
          nativeRecRef.current = null;
          setRecState("recorded");
        }
      }
    } catch {
      setErrorMsg("Erro ao parar gravação.");
      setRecState("error");
    }
  }

  async function handleUpload() {
    setRecState("uploading");
    setErrorMsg("");
    try {
      let audioBase64 = "";
      let mimeType = "audio/webm";

      if (Platform.OS === "web") {
        if (!webBlobRef.current) throw new Error("Nenhum áudio gravado");
        audioBase64 = await blobToBase64(webBlobRef.current);
        mimeType = webMimeRef.current;
      } else {
        const FS = await import("expo-file-system");
        const uri = nativeUriRef.current;
        if (!uri) throw new Error("URI do áudio não encontrada");
        audioBase64 = await FS.readAsStringAsync(uri, { encoding: "base64" });
        mimeType = "audio/m4a";
      }

      const res = await fetch(getApiUrl("/api/alerts/voice-upload"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, audioBase64, mimeType }),
      });
      if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
      const data = (await res.json()) as { url: string };
      setRecState("uploaded");
      onUploaded?.(data.url);
    } catch (err: unknown) {
      setErrorMsg(String(err));
      setRecState("error");
    }
  }

  function handleReset() {
    webBlobRef.current = null;
    webStopRef.current = null;
    nativeUriRef.current = null;
    nativeRecRef.current = null;
    setDuration(0);
    setErrorMsg("");
    setMicUnavailable(false);
    setRecState("idle");
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <View style={st.wrap}>
      <Text style={[st.hint, { color: colors.mutedForeground }]}>
        Grave ou envie uma mensagem curta (máx. ~30 s) — seus contatos ouvirão este áudio durante a ligação de emergência.
      </Text>

      {/* ── Idle state ───────────────────────────────────────────── */}
      {recState === "idle" && (
        <View style={st.idleGroup}>
          {/* Record via microphone — always visible */}
          <Pressable
            style={[st.recordBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Iniciar gravação de voz de emergência"
          >
            <Ionicons name="mic" size={22} color={colors.primary} />
            <Text style={[st.btnText, { color: colors.primary }]}>Gravar Mensagem de Emergência</Text>
          </Pressable>

          {/* Mic error notice (shown only after a failed attempt) */}
          {micUnavailable && (
            <View style={[st.infoBox, { borderColor: "#ff9f0a40", backgroundColor: "#ff9f0a08" }]}>
              <Ionicons name="warning-outline" size={16} color="#ff9f0a" />
              <Text style={[st.hint, { color: colors.mutedForeground, flex: 1 }]}>
                Microfone não detectado. Use o botão abaixo para enviar um arquivo de áudio gravado no seu dispositivo.
              </Text>
            </View>
          )}

          {/* File upload — always visible on web, and on native as fallback */}
          {Platform.OS === "web" && (
            <Pressable
              style={[st.fileBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handlePickFile}
              accessibilityRole="button"
              accessibilityLabel="Escolher arquivo de áudio"
            >
              <Ionicons name="document-attach-outline" size={20} color={colors.mutedForeground} />
              <Text style={[st.btnText, { color: colors.foreground }]}>Enviar arquivo de áudio</Text>
              <Text style={[st.hint, { color: colors.mutedForeground }]}>.mp3 .m4a .wav .ogg</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Recording ────────────────────────────────────────────── */}
      {recState === "recording" && (
        <View style={st.recordingRow}>
          <View style={st.pulseDot} />
          <Text style={[st.durText, { color: "#e63946" }]}>{fmt(duration)}</Text>
          <Pressable style={st.stopBtn} onPress={handleStop} accessibilityRole="button" accessibilityLabel="Parar gravação">
            <Ionicons name="stop" size={16} color="#fff" />
            <Text style={st.stopBtnText}>Parar</Text>
          </Pressable>
        </View>
      )}

      {/* ── Recorded (ready to save) ──────────────────────────────── */}
      {recState === "recorded" && (
        <View style={[st.box, { borderColor: "#22c55e40", backgroundColor: "#22c55e08" }]}>
          <View style={st.boxRow}>
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            <Text style={[st.boxTitle, { color: colors.foreground }]}>
              Gravação pronta — {fmt(duration)}
            </Text>
          </View>
          <View style={st.btnRow}>
            <Pressable
              style={[st.halfBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Regravar"
            >
              <Ionicons name="refresh" size={15} color={colors.mutedForeground} />
              <Text style={[st.halfBtnText, { color: colors.mutedForeground }]}>Regravar</Text>
            </Pressable>
            <Pressable
              style={[st.halfBtn, { borderColor: colors.primary, backgroundColor: colors.primary }]}
              onPress={handleUpload}
              accessibilityRole="button"
              accessibilityLabel="Salvar áudio de emergência"
            >
              <Ionicons name="cloud-upload-outline" size={15} color="#fff" />
              <Text style={[st.halfBtnText, { color: "#fff" }]}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Uploading ─────────────────────────────────────────────── */}
      {recState === "uploading" && (
        <View style={st.uploadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[st.hint, { color: colors.mutedForeground }]}>Enviando áudio…</Text>
        </View>
      )}

      {/* ── Uploaded ──────────────────────────────────────────────── */}
      {recState === "uploaded" && (
        <View style={[st.box, { borderColor: "#22c55e40", backgroundColor: "#22c55e08", flexDirection: "row" }]}>
          <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[st.boxTitle, { color: colors.foreground }]}>Áudio salvo!</Text>
            <Text style={[st.hint, { color: colors.mutedForeground, marginTop: 2 }]}>
              Seus contatos ouvirão esta mensagem nas ligações automáticas.
            </Text>
          </View>
          <Pressable onPress={handleReset} accessibilityRole="button" accessibilityLabel="Trocar áudio">
            <Ionicons name="refresh-outline" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {recState === "error" && (
        <View style={[st.box, { borderColor: "#e6394630", backgroundColor: "#e6394608", flexDirection: "row", alignItems: "center", gap: 8 }]}>
          <Ionicons name="alert-circle-outline" size={18} color="#e63946" />
          <Text style={[st.hint, { color: "#e63946", flex: 1 }]}>{errorMsg || "Erro desconhecido."}</Text>
          <Pressable onPress={handleReset} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 12 },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  idleGroup: { gap: 10 },
  recordBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 18,
  },
  fileBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 10, borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16,
  },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  recordingRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#e6394610", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#e6394630",
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e63946" },
  durText: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  stopBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#e63946", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
  },
  stopBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  box: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  boxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  boxTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  btnRow: { flexDirection: "row", gap: 10 },
  halfBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10,
  },
  halfBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  uploadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
});
