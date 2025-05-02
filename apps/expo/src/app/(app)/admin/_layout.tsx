import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import CustomHeader from "@/components/CustomHeader";
import LoadingScreen from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";

/**
 * Layout for admin routes
 * Requires 'admin' role for access
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const { isSignedIn, isLoading, user } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // Check if user has admin role
  if (!user?.roles.includes("admin")) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? <LoadingScreen /> : null}
      <Stack
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t("admin.dashboard_title"),
            header: () => <CustomHeader title={t("admin.dashboard_title")} />,
          }}
        />
        <Stack.Screen
          name="locations"
          options={{
            title: t("admin.locations_title"),
            header: () => <CustomHeader title={t("admin.locations_title")} />,
          }}
        />
      </Stack>
    </View>
  );
}
