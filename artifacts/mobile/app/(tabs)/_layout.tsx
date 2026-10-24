import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import DisguiseScreen from "./DisguiseScreen";

const TAB_CONFIG = [
  {
    name: "history",
    labelKey: "tabs.history",
    icon: (color: string) => <Ionicons name="time-outline" size={22} color={color} />,
  },
  {
    name: "community",
    labelKey: "tabs.community",
    icon: (color: string) => <Ionicons name="people-outline" size={22} color={color} />,
  },
  {
    name: "index",
    labelKey: "tabs.sos",
    icon: (_color: string) => null,
    isSOS: true,
  },
  {
    name: "contacts",
    labelKey: "tabs.contacts",
    icon: (color: string) => <Ionicons name="call-outline" size={22} color={color} />,
  },
  {
    name: "profile",
    labelKey: "tabs.profile",
    icon: (color: string) => <Ionicons name="person-outline" size={22} color={color} />,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 8 : insets.bottom;

  return (
    <View
      style={[
        tabBarStyles.bar,
        {
          backgroundColor: "#1c1c1e",
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const tab = TAB_CONFIG.find((cfg) => cfg.name === route.name);
        if (!tab) return null;
        const isFocused = state.index === index;
        const label = t(tab.labelKey);

        function onPress() {
          Haptics.selectionAsync();
          try {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          } catch {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          }
        }

        if (tab.isSOS) {
          return (
            <View key={route.key} style={tabBarStyles.sosContainer}>
              <Pressable onPress={onPress} style={tabBarStyles.sosButton}>
                <MaterialCommunityIcons name="shield-alert" size={28} color="#ffffff" />
              </Pressable>
              <Text style={[tabBarStyles.sosLabel, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
                {label}
              </Text>
            </View>
          );
        }

        const iconColor = isFocused ? colors.primary : colors.mutedForeground;

        return (
          <Pressable key={route.key} style={tabBarStyles.tab} onPress={onPress}>
            {tab.icon(iconColor)}
            <Text style={[tabBarStyles.tabLabel, { color: iconColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    height: Platform.OS === "web" ? 76 : undefined,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  sosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -22,
    gap: 3,
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  sosLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
});

export default function TabLayout() {
  const { userId } = useUser();
  const { data: settings } = useGetSettings(userId ?? 0, {
    query: { queryKey: getGetSettingsQueryKey(userId ?? 0), enabled: !!userId },
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="history" />
        <Tabs.Screen name="community" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="contacts" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {settings?.discreteMode && (
        <View style={StyleSheet.absoluteFillObject}>
          <DisguiseScreen />
        </View>
      )}
    </View>
  );
}
