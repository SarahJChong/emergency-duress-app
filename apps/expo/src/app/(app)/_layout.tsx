import { Stack } from "expo-router";

import OfflineBanner from "@/components/OfflineBanner";
import { useIsOffline } from "@/hooks/useIsOffline";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function RootLayout() {
  const { isOffline } = useIsOffline();
  usePushNotifications(); // Initialize push notifications

  return (
    <>
      <OfflineBanner isVisible={isOffline} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
