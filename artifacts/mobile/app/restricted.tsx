import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export default function RestrictedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 24, paddingBottom: botPad + 24 }]}>
      <View style={styles.iconWrap}>
        <View style={[styles.iconBadge, { backgroundColor: "#ff453a22", borderColor: "#ff453a40" }]}>
          <MaterialCommunityIcons name="shield-lock" size={56} color="#ff453a" />
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: "#ff453a" }]}>
        <Text style={styles.badgeText}>ACESSO RESTRITO</Text>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        Este aplicativo é exclusivo para mulheres
      </Text>

      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        O SOS Mulher foi desenvolvido especificamente para proteger mulheres em situações de vulnerabilidade. O cadastro está disponível apenas para mulheres e pessoas não-binárias.
      </Text>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="information-circle" size={20} color="#0a84ff" style={{ marginTop: 1 }} />
        <Text style={[styles.infoText, { color: colors.foreground }]}>
          Se você está em perigo, ligue imediatamente para{" "}
          <Text style={{ fontFamily: "Inter_700Bold", color: "#ff453a" }}>190 (Polícia)</Text>
          {" "}ou{" "}
          <Text style={{ fontFamily: "Inter_700Bold", color: colors.primary }}>180 (Central da Mulher)</Text>.
        </Text>
      </View>

      <Pressable
        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.replace("/onboarding");
        }}
      >
        <Ionicons name="arrow-back" size={18} color={colors.foreground} />
        <Text style={[styles.btnText, { color: colors.foreground }]}>Voltar ao início</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconBadge: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
