import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";

/**
 * Root route handler
 * Redirects to appropriate dashboard based on user role:
 * - admin -> /admin
 * - security -> /security
 * - user (or no role) -> /user
 */
export default function Index() {
  const { isSignedIn, user, isLoading } = useAuth();
  const { isOfflineWithUser } = useIsOffline();

  // If not signed in, go to sign in page
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (user?.roles?.includes("admin")) {
    // Role-based routing
    return <Redirect href="/admin" />;
  }

  if (user?.roles?.includes("security") || user?.roles?.includes("manager")) {
    return <Redirect href="/security" />;
  }

  // Default case: redirect to user dashboard
  // This covers both users with 'user' role and users with no roles
  return <Redirect href="/user" />;
}
