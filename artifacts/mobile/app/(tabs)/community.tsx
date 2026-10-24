import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPosts,
  useCreatePost,
  useDeletePost,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/context/UserContext";

type ApoioTip = {
  icon: string;
  title: string;
  body: string;
  action: { type: "tel"; number: string } | { type: "maps"; query: string } | { type: "url"; url: string };
  actionLabel: string;
};

const APOIO_TIPS: ApoioTip[] = [
  {
    icon: "call-outline",
    title: "Central de Atendimento \u00e0 Mulher",
    body: "Ligue 180 \u2014 atendimento gratuito, 24h, sigiloso.",
    action: { type: "tel", number: "180" },
    actionLabel: "Ligar 180",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Pol\u00edcia Militar",
    body: "Ligue 190 em situa\u00e7\u00f5es de perigo imediato.",
    action: { type: "tel", number: "190" },
    actionLabel: "Ligar 190",
  },
  {
    icon: "medkit-outline",
    title: "SAMU",
    body: "Ligue 192 para emerg\u00eancias de sa\u00fade.",
    action: { type: "tel", number: "192" },
    actionLabel: "Ligar 192",
  },
  {
    icon: "home-outline",
    title: "Casa da Mulher Brasileira",
    body: "Atendimento integrado para vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­timas de violÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªncia. Toque para ver a unidade mais prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³xima.",
    action: { type: "maps", query: "Casa da Mulher Brasileira" },
    actionLabel: "Ver no mapa",
  },
  {
    icon: "document-text-outline",
    title: "Delegacia da Mulher (DEAM)",
    body: "Registre um B.O. Toque para ver a delegacia mais prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³xima de vocÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âª.",
    action: { type: "maps", query: "Delegacia da Mulher DEAM" },
    actionLabel: "Ver no mapa",
  },
  {
    icon: "heart-outline",
    title: "CVV ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Apoio Emocional",
    body: "Ligue 188 ou acesse cvv.org.br ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 24h, gratuito.",
    action: { type: "tel", number: "188" },
    actionLabel: "Ligar 188",
  },
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s`;
  return date.toLocaleDateString("pt-BR");
}

type Post = { id: number; userId: number; userName: string; content: string; createdAt: string; imageUrl?: string | null };

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, userName } = useUser();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"chat" | "apoio">("chat");
  const [newPost, setNewPost] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");
  const [attachedPhotoBase64, setAttachedPhotoBase64] = useState<string | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [postToast, setPostToast] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 120 : insets.bottom + 80;

  const { data: posts, isLoading, refetch } = useListPosts({
    query: { queryKey: getListPostsQueryKey() },
  });

  const createPost = useCreatePost();
  const deletePost = useDeletePost();

  async function handlePost() {
    if (!userId || !userName) return;
    const content = newPost.trim();
    if (!content && !attachedPhoto) return;
    try {
      let imageUrl: string | undefined;

      if (attachedPhoto) {
        const file = attachedPhotoBase64;
        if (!file) throw new Error("Nao foi possivel ler a foto selecionada.");

        const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

        const response = await fetch(`${apiUrl}/api/community/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file,
            mimeType: photoMimeType,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao enviar foto");
        }

        const result = await response.json();
        imageUrl = result.url;
      }

      await createPost.mutateAsync({
        data: {
          userId,
          userName,
          content: content || "[Foto compartilhada]",
          imageUrl,
        },
      });
      await qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
      setNewPost("");
      setAttachedPhoto(null);
      setAttachedPhotoBase64(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPostToast(true);
      setTimeout(() => setPostToast(false), 3000);
    } catch {
      Alert.alert("Erro", "NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel publicar. Tente novamente.");
    }
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("PermissÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o necessÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ria", "Permita o acesso ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  galeria para anexar fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const photo = result.assets[0];
      setAttachedPhoto(photo.uri);
      setPhotoMimeType(photo.mimeType ?? "image/jpeg");
      setAttachedPhotoBase64(photo.base64 ?? null);
    }
  }

  function handleVoice() {
    Alert.alert("Nota de Voz", "Segure o botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o e fale sua mensagem. (Recurso disponÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel na versÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o nativa)", [{ text: "OK" }]);
  }

  const handleDeleteRequest = useCallback((postId: number) => {
    setPendingDeleteId(postId);
  }, []);

  const handleDeleteConfirm = useCallback(async (postId: number) => {
    setDeletingId(postId);
    setPendingDeleteId(null);
    try {
      await deletePost.mutateAsync({ postId });
      await qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erro", "NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel excluir a publicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o.");
    } finally {
      setDeletingId(null);
    }
  }, [deletePost, qc]);

  const firstName = userName?.split(" ")[0] ?? "VocÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âª";

  function renderPost({ item }: { item: Post }) {
    const isOwn = item.userId === userId;
    const isDeleting = deletingId === item.id;
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.userName[0] ?? "?").toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.postUser}>{item.userName}</Text>
            <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
          </View>
          {isOwn && (
            pendingDeleteId === item.id ? (
              <View style={styles.inlineConfirmWrap} accessible={true} accessibilityLiveRegion="polite">
                <Pressable
                  style={styles.inlineConfirmNo}
                  onPress={() => setPendingDeleteId(null)}
                  accessibilityRole="button"
                  accessibilityLabel="NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o excluir"
                >
                  <Text style={styles.inlineConfirmNoText}>NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o</Text>
                </Pressable>
                <Pressable
                  style={styles.inlineConfirmYes}
                  onPress={() => handleDeleteConfirm(item.id)}
                  disabled={isDeleting}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar exclusÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o da publicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o"
                >
                  {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.inlineConfirmYesText}>Excluir</Text>}
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.trashBtn}
                onPress={() => handleDeleteRequest(item.id)}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Excluir publicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o"
                accessibilityHint="Solicita confirmaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o antes de excluir"
              >
                {isDeleting ? <ActivityIndicator size="small" color="#e63946" /> : <Ionicons name="trash-outline" size={18} color="#e63946" />}
              </Pressable>
            )
          )}
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        {item.imageUrl ? (
          <Image
            source={{
              uri: item.imageUrl.startsWith("http")
                ? item.imageUrl
                : `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080"}${item.imageUrl}`,
            }}
            style={{ width: "100%", height: 220, borderRadius: 12, marginTop: 10 }}
            resizeMode="cover"
          />
        ) : null}
      </View>
    );
  }

  const postList = (posts as Post[] | undefined) ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={botPad}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="heart" size={20} color="#e63946" />
          </View>
          <View>
            <Text style={styles.headerLabel}>COMUNIDADE</Text>
            <Text style={styles.headerTitle}>Mulher Ajuda Mulher</Text>
          </View>
        </View>
        <Pressable
          style={styles.refreshBtn}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Atualizar publicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes"
          accessibilityHint="Recarrega o feed da comunidade"
        >
          <Ionicons name="refresh" size={20} color="#e63946" />
        </Pressable>
      </View>

      {/* Security banner */}
      <Pressable
        style={[styles.securityBanner, securityOpen && styles.securityBannerOpen]}
        onPress={() => setSecurityOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Avisos de seguranÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§a"
        accessibilityState={{ expanded: securityOpen }}
        accessibilityHint={securityOpen ? "Toque para fechar" : "Toque para ver avisos de emergÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âªncia"}
      >
        <Ionicons name="shield-checkmark" size={16} color="#e63946" />
        <Text style={styles.securityBannerText}>{"Ver avisos de seguran\u00e7a"}</Text>
        <Ionicons name={securityOpen ? "chevron-up" : "chevron-down"} size={16} color="#e63946" style={{ marginLeft: "auto" }} />
      </Pressable>
      {securityOpen && (
        <View style={styles.securityContent}>
          <Text style={styles.securityItem}>{"Em caso de perigo: pressione o bot\u00e3o SOS ou ligue 190"}</Text>
          <Text style={styles.securityItem}>{"Central da Mulher: ligue 180 (24h, gratuito)"}</Text>
          <Text style={styles.securityItem}>{"Emerg\u00eancias de sa\u00fade: SAMU 192"}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow} accessibilityRole="tablist">
        <Pressable
          style={styles.tabBtn}
          onPress={() => setTab("chat")}
          accessibilityRole="tab"
          accessibilityLabel="Chat"
          accessibilityState={{ selected: tab === "chat" }}
        >
          <Ionicons name="chatbubble-outline" size={14} color={tab === "chat" ? "#e63946" : "#999"} />
          <Text style={[styles.tabText, tab === "chat" && styles.tabTextActive]}>CHAT</Text>
          {tab === "chat" && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable
          style={styles.tabBtn}
          onPress={() => setTab("apoio")}
          accessibilityRole="tab"
          accessibilityLabel="Apoio e recursos"
          accessibilityState={{ selected: tab === "apoio" }}
        >
          <Ionicons name="hand-left-outline" size={14} color={tab === "apoio" ? "#e63946" : "#999"} />
          <Text style={[styles.tabText, tab === "apoio" && styles.tabTextActive]}>APOIO</Text>
          {tab === "apoio" && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      {tab === "chat" ? (
        <>
          {/* Composer */}
          <View style={styles.composer}>
            <View style={styles.composerAvatar}>
              <Text style={styles.composerAvatarText}>{(firstName[0] ?? "?").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <TextInput
                style={styles.composerInput}
                placeholder="Compartilhe algo com a comunidade..."
                placeholderTextColor="#bbb"
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={500}
                accessibilityLabel="Campo de texto para nova publicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o"
                accessibilityHint="Escreva uma mensagem para compartilhar com a comunidade"
              />
              {attachedPhoto && (
                <View style={styles.attachedPhotoWrap}>
                  <Image source={{ uri: attachedPhoto }} style={styles.attachedPhoto} />
                  <Pressable style={styles.removePhotoBtn} onPress={() => { setAttachedPhoto(null); setAttachedPhotoBase64(null); }}>
                    <Ionicons name="close-circle" size={20} color="#e63946" />
                  </Pressable>
                </View>
              )}
              <View style={styles.composerActions}>
                <Pressable
                  style={styles.composerActionBtn}
                  onPress={handlePickPhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Anexar foto"
                  accessibilityHint="Abre a galeria para selecionar uma imagem"
                >
                  <Ionicons name="image-outline" size={18} color="#888" />
                  <Text style={styles.composerActionText}>Foto</Text>
                </Pressable>
                <Pressable
                  style={styles.composerActionBtn}
                  onPress={handleVoice}
                  accessibilityRole="button"
                  accessibilityLabel="Nota de voz"
                  accessibilityHint="Abre o gravador de voz"
                >
                  <Ionicons name="mic-outline" size={18} color="#888" />
                  <Text style={styles.composerActionText}>Voz</Text>
                </Pressable>
                <Pressable
                  style={[styles.publishBtn, (!newPost.trim() && !attachedPhoto || createPost.isPending) && styles.publishBtnDisabled]}
                  onPress={handlePost}
                  disabled={(!newPost.trim() && !attachedPhoto) || createPost.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Publicar mensagem"
                  accessibilityState={{ disabled: !newPost.trim() && !attachedPhoto }}
                >
                  {createPost.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={14} color="#fff" />
                      <Text style={styles.publishBtnText}>Publicar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Post success toast */}
          {postToast && (
            <View style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.toastText}>PublicaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o enviada com sucesso!</Text>
            </View>
          )}

          {/* Posts list */}
          {isLoading ? (
            <ActivityIndicator color="#e63946" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={postList}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPost}
              extraData={{ pendingDeleteId, deletingId }}
              contentContainerStyle={[styles.listContent, { paddingBottom: botPad }]}
              showsVerticalScrollIndicator={false}
              onRefresh={refetch}
              refreshing={isLoading}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyFlower}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¸</Text>
                  <Text style={styles.emptyTitle}>Seja a primeira!</Text>
                  <Text style={styles.emptySub}>
                    Compartilhe uma mensagem de apoio,{"\n"}dica de seguranÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§a ou relato.
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        /* APOIO tab */
        <FlatList
          data={APOIO_TIPS}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[styles.listContent, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            function handleAction() {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (item.action.type === "tel") {
                Linking.openURL(`tel:${item.action.number}`);
              } else if (item.action.type === "maps") {
                const encoded = encodeURIComponent(item.action.query);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
              } else if (item.action.type === "url") {
                Linking.openURL(item.action.url);
              }
            }
            const isMaps = item.action.type === "maps";
            return (
              <Pressable
                style={({ pressed }) => [styles.apoioCard, pressed && { opacity: 0.75 }]}
                onPress={handleAction}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityHint={isMaps ? "Abre o Google Maps com o local mais prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo" : "Abre o discador"}
              >
                <View style={styles.apoioIcon}>
                  <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>["name"]} size={22} color="#e63946" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apoioTitle}>{item.title}</Text>
                  <Text style={styles.apoioBody}>{item.body}</Text>
                </View>
                <View style={[styles.apoioActionBtn, isMaps && styles.apoioActionBtnMap]}>
                  <Ionicons
                    name={isMaps ? "location" : "call"}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.apoioActionText}>{item.actionLabel}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f5e6e8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fce4e6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#e63946", letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1c1c1e" },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fce4e6",
    alignItems: "center",
    justifyContent: "center",
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fce4e6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5c6cb",
  },
  securityBannerOpen: { borderBottomWidth: 0 },
  securityBannerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#e63946", flex: 1 },
  securityContent: { backgroundColor: "#fff5f5", paddingHorizontal: 16, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: "#f5c6cb" },
  securityItem: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7f1d1d", lineHeight: 20 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e0e2",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    position: "relative",
  },
  tabText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#999", letterSpacing: 0.5 },
  tabTextActive: { color: "#e63946" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "#e63946",
    borderRadius: 1,
  },
  composer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e0e2",
  },
  composerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fce4e6",
    alignItems: "center",
    justifyContent: "center",
  },
  composerAvatarText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#e63946" },
  composerInput: {
    backgroundColor: "#f9f0f1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1c1c1e",
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#f0d4d7",
  },
  attachedPhotoWrap: { position: "relative", alignSelf: "flex-start" },
  attachedPhoto: { width: 80, height: 80, borderRadius: 10 },
  removePhotoBtn: { position: "absolute", top: -6, right: -6 },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f9f0f1",
  },
  composerActionText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#888" },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
    backgroundColor: "#e63946",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  publishBtnDisabled: { opacity: 0.4 },
  publishBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  listContent: { paddingHorizontal: 14, paddingTop: 8 },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0e0e2",
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fce4e6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#e63946" },
  postUser: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#e63946" },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#aaa", marginTop: 1 },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#333", lineHeight: 21 },
  trashBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyFlower: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#333" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#999", textAlign: "center", lineHeight: 22 },
  apoioCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0e0e2",
  },
  apoioIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fce4e6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  apoioTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1c1c1e", marginBottom: 4 },
  apoioBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#666", lineHeight: 19 },
  apoioActionBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#e63946",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
    alignSelf: "center" as const,
  },
  apoioActionBtnMap: { backgroundColor: "#0f7b3a" },
  apoioActionText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bbf7d0",
  },
  toastText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#16a34a" },
  inlineConfirmWrap: { flexDirection: "row", gap: 6, alignItems: "center" },
  inlineConfirmNo: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  inlineConfirmNoText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#666" },
  inlineConfirmYes: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#e63946" },
  inlineConfirmYesText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});
