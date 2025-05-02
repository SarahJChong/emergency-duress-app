import { useEffect } from "react";
import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import CustomHeader from "@/components/CustomHeader";
import LoadingScreen from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";

export default function SecurityLayout() {
  const { t } = useTranslation();
  const { isSignedIn, isLoading, user } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // Check if user has security role
  if (!user?.roles.includes("security") && !user?.roles.includes("manager")) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? <LoadingScreen /> : null}
      <Stack
        screenOptions={{
          headerShown: true,
          header: () => (
            <CustomHeader
              title={t("security.dashboard_title")}
              href="/security"
            />
          ),
        }}
      />
    </View>
  );
}
