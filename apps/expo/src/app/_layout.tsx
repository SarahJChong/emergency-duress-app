import "@/global.css";
import "react-native-reanimated";
import "../localization/i18n"; // Initialize i18n

import { AppState, Platform } from "react-native";
import type { AppStateStatus } from "react-native";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import { Slot, Stack } from "expo-router";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  persistQueryClient,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { I18nextProvider } from "react-i18next";

import { env } from "@/env";
import { AuthProvider } from "@/hooks/useAuth";
import i18n from "../localization/i18n";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Configure default notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Setup platform-specific online state management
const setupOnlineManager = () => {
  if (Platform.OS === "web" && typeof window === "undefined") return;

  // Enhanced online manager that considers both connection status and API reachability
  onlineManager.setEventListener((setOnline) => {
    const eventSubscription = Network.addNetworkStateListener((state) => {
      // Consider a device online only if it has both connection and internet reachability
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return eventSubscription.remove;
  });
};

// Setup focus management for React Native
const setupFocusManager = () => {
  if (Platform.OS === "web" || typeof global.document !== "undefined") return;

  const subscription = AppState.addEventListener(
    "change",
    (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    },
  );

  return () => subscription.remove();
};

setupOnlineManager();
setupFocusManager();

const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: {
      shouldDehydrateQuery: (query) => query.state.data != null,
    },
    queries: {
      networkMode: "offlineFirst",
      gcTime: Infinity, // Never garbage collect queries
      staleTime: 1000 * 30, // 30 seconds
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  useReactQueryDevTools(queryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <I18nextProvider i18n={i18n}>
        <AuthProvider
          clientId={env.EXPO_PUBLIC_AUTH_CLIENT_ID}
          endpoint={env.EXPO_PUBLIC_AUTH_ENDPOINT}
        >
          <Slot />
        </AuthProvider>
      </I18nextProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </PersistQueryClientProvider>
  );
}
