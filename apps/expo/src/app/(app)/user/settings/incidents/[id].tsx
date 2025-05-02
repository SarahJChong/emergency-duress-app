import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/utils/formatDate";
import { useIncidents } from "@/hooks/useIncidents";
import { useIsOffline } from "@/hooks/useIsOffline";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  const { t } = useTranslation();
  return (
    <View className="flex-row border-b border-gray-100 py-2">
      <Text className="w-1/3 text-gray-500">{label}</Text>
      <Text className="flex-1 font-medium">
        {value || t("user.incidents.incident.not_provided")}
      </Text>
    </View>
  );
};
export default function IncidentDetailsPage() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incident, isLoading, error } = useIncidents(id);
  const { isOffline } = useIsOffline();

  const status = incident?.status;
  const isClosed = status === "Closed";
  const isCancelled = status === "Cancelled";

  if (incident) {
    return (
      <>
        <Stack.Screen
          options={{ headerTitle: t("user.incidents.incident.details_header") }}
        />
        <ScrollView className="flex-1 bg-gray-50 p-4">
          <View className="rounded-lg bg-white p-4 shadow-sm">
            <View className="mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold">
                {t("user.incidents.incident.report_title")}
              </Text>
              <View className="mt-1 flex-row">
                <View
                  className={`rounded-full px-2 py-1 ${
                    status === "Open"
                      ? "bg-yellow-100"
                      : status === "Closed"
                        ? "bg-green-100"
                        : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      status === "Open"
                        ? "text-yellow-800"
                        : status === "Closed"
                          ? "text-green-800"
                          : "text-red-800"
                    }`}
                  >
                    {status} {incident.isPending && "(Offline)"}
                  </Text>
                </View>
              </View>
            </View>
            <DetailRow
              label={t("user.incidents.incident.date_called")}
              value={formatDate(incident.dateCalled)}
            />
            <DetailRow
              label={t("user.incidents.incident.status")}
              value={status}
            />
            <DetailRow
              label={t("user.incidents.incident.name")}
              value={incident.isAnonymous ? t("user.anonymous") : incident.name}
            />
            <DetailRow
              label={t("user.incidents.incident.location")}
              value={
                incident.location?.name ??
                (incident.isAnonymous
                  ? t("user.anonymous")
                  : t("user.incidents.incident.not_provided"))
              }
            />
            {incident.roomNumber && (
              <DetailRow
                label={t("user.incidents.incident.room_number")}
                value={incident.roomNumber}
              />
            )}

            {incident && isClosed && !incident.isPending && (
              <>
                <DetailRow
                  label={t("user.incidents.incident.date_closed")}
                  value={
                    incident.dateClosed
                      ? formatDate(incident.dateClosed)
                      : undefined
                  }
                />
                <DetailRow
                  label={t("user.incidents.incident.closed_by")}
                  value={incident.closedBy}
                />
                <DetailRow
                  label={t("user.incidents.incident.closure_notes")}
                  value={incident.closureNotes}
                />
              </>
            )}

            {incident && isCancelled && (
              <>
                <DetailRow
                  label={t("user.incidents.incident.date_cancelled")}
                  value={formatDate(incident.dateClosed ?? new Date())}
                />
                <DetailRow
                  label={t("user.incidents.incident.cancellation_reason")}
                  value={incident.cancellationReason}
                />
              </>
            )}
          </View>
        </ScrollView>
      </>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center py-20">
        <Text className="text-red-500">
          {t("user.incidents.incident.error_loading")}
        </Text>
        <Text className="mt-2 text-gray-500">{(error as Error).message}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-2">{t("user.incidents.incident.loading")}</Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-20">
      <Text className="text-gray-500">
        {isOffline
          ? t("user.incidents.incident.not_found_offline")
          : t("user.incidents.incident.not_found")}
      </Text>
    </View>
  );
}
