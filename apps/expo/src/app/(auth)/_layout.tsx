import { Redirect, Stack } from "expo-router";

import OfflineBanner from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";

/**
 * Layout for authentication routes (/sign-in and /register)
 * If user is signed in, redirect to / which will then route to appropriate dashboard based on role
 * If not signed in, show auth pages
 */
export default function AuthRoutesLayout() {
  const { isSignedIn, isLoading } = useAuth();
  const { isOffline, isOfflineWithUser } = useIsOffline();

  // Only redirect if on sign-in page and already signed in
  if (isSignedIn && isOfflineWithUser && !isLoading) {
    return <Redirect href="/" />;
  }

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
