import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider, useUser } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";

// Configuração da URL do servidor no Render
const _apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? "https://asset-manager-app-1.onrender.com";
setBaseUrl(_apiUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function WebWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0a0a",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 430,
          overflow: "hidden",
          alignSelf: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function RootLayoutNav() {
  const { userId, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (!userId) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [userId, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="restricted"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="incidents"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <WebWrapper>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <LanguageProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </LanguageProvider>
            </UserProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </WebWrapper>
  );
}
