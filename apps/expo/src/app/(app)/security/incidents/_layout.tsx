import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SecurityLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{ headerTitle: t("security.incident_details") }}
      />
    </Stack>
  );
}
