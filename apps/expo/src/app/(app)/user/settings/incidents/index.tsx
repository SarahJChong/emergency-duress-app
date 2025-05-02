import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import { formatDate } from "@/utils/formatDate";
import { useIncidents } from "@/hooks/useIncidents";
import { useIsOffline } from "@/hooks/useIsOffline";

const IncidentItem = ({
  id,
  dateCalled,
  status,
  location,
  locationId,
  isPending,
  isAnonymous,
  name,
}: {
  id: string;
  dateCalled: Date;
  status: string;
  location?: { name: string } | null;
  locationId?: string;
  isPending?: boolean;
  isAnonymous?: boolean;
  name?: string;
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/user/settings/incidents/[id]",
      params: { id },
    });
  };

  const displayName = isAnonymous ? "Anonymous" : "";

  const displayLocation =
    location?.name ?? (isAnonymous ? "Anonymous" : "Not provided");

  return (
    <View>
      {isPending && (
        <View className="rounded-t-full bg-yellow-100 px-2 py-1">
          <Text className="self-center text-xs text-yellow-800">Offline</Text>
        </View>
      )}
      <Pressable
        className="mb-2 rounded-md border border-gray-200 bg-white p-4"
        onPress={handlePress}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold">
            {formatDate(dateCalled)}
          </Text>
          <View
            className={`rounded-full px-2 py-1 ${
              status === "Open"
                ? "bg-yellow-100"
                : status === "Closed"
                  ? "bg-green-100"
                  : status === "Cancelled"
                    ? "bg-red-100"
                    : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm ${
                status === "Open"
                  ? "text-yellow-800"
                  : status === "Closed"
                    ? "text-green-800"
                    : status === "Cancelled"
                      ? "text-red-800"
                      : "text-gray-800"
              }`}
            >
              {status}
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-gray-700">{displayName}</Text>
        <Text className="mt-0.5 text-gray-600">{displayLocation}</Text>
      </Pressable>
    </View>
  );
};

export default function Page() {
  const { incidents, error } = useIncidents();
  const { isOffline } = useIsOffline();

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Incident History" }} />
      <View className="flex-1 bg-gray-50 p-6">
        {incidents.length > 0 ? (
          <FlashList
            data={incidents}
            renderItem={({ item }) => (
              <IncidentItem
                id={item.id}
                dateCalled={item.dateCalled}
                status={item.status}
                location={item.location}
                locationId={item.locationId}
                isPending={item.isPending}
                isAnonymous={item.isAnonymous}
                name={item.name}
              />
            )}
            estimatedItemSize={100}
            showsVerticalScrollIndicator={false}
          />
        ) : incidents.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">
              {isOffline
                ? "No incidents found (offline mode)"
                : "No incidents found"}
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-red-500">Error loading incidents</Text>
            <Text className="mt-2 text-gray-500">
              {(error as Error).message}
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" className="text-primary" />
            <Text className="mt-2">Loading incidents...</Text>
          </View>
        )}
      </View>
    </>
  );
}
