import { View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";

import CustomHeader from "@/components/CustomHeader";
import LoadingScreen from "@/components/Loading";
import OfflineBanner from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";
import { useMeQuery } from "@/hooks/useQueries";
import { useSyncPendingIncidents } from "@/hooks/useSyncPendingIncidents";

export default function UserLayout() {
  const { isSignedIn, isLoading, user } = useAuth();
  const userQuery = useMeQuery(isSignedIn);
  const { isOffline } = useIsOffline();

  // Add hook to sync offline incidents when app loads
  useSyncPendingIncidents();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // Check if user has a role other than 'user'
  if (user?.roles && user.roles.length > 0 && !user.roles.includes("user")) {
    // If user has security role, redirect to security dashboard
    if (user.roles.includes("security")) {
      return <Redirect href="/security" />;
    }

    // Add other role-specific redirects here if needed
    return <Redirect href="/" />;
  }

  if (userQuery.data) {
    if (!userQuery.data.location) {
      return <Redirect href="/register" />;
    }

    return (
      <>
        {/* <OfflineBanner isVisible={isOffline} /> */}
        {isLoading ? <LoadingScreen /> : null}
        <Tabs
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: process.env.EXPO_PUBLIC_COLOR_SECONDARY,
            tabBarInactiveTintColor: "#9D9D9D",
            tabBarAccessibilityLabel: "Tab bar",
            tabBarLabelStyle: {
              fontSize: 16,
            },
            tabBarStyle: {
              height: 56,
              backgroundColor: process.env.EXPO_PUBLIC_COLOR_PRIMARY,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t("user.tabs.duress"),
              tabBarIcon: ({ color }) => (
                <Ionicons name="alert-circle" size={28} color={color} />
              ),
              header: () => (
                <CustomHeader title={t("user.headers.emergency_request")} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: t("user.tabs.settings"),
              tabBarIcon: ({ color }) => (
                <Ionicons name="settings" size={28} color={color} />
              ),
              header: () => (
                <CustomHeader
                  title={t("user.headers.settings")}
                  href="/user/settings"
                />
              ),
            }}
          />
        </Tabs>
      </>
    );
  }

  if (userQuery.isError) {
    return <Redirect href="/register" />;
  }

  return (
    <View className="flex-1 bg-white">
      <LoadingScreen />
    </View>
  );
}
