import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { formatDate, formatDuration } from "@/utils/formatDate";
import Button from "@/components/Button";
import CloseIncidentModal from "@/components/CloseIncidentModal";
import LocationMapView from "@/components/MapView";
import {
  useSecurityIncidentActions,
  useSecurityIncidentDetails,
} from "@/hooks/useSecurityIncidents";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <View className="flex-row border-b border-gray-100 py-2">
    <Text className="w-1/3 text-gray-500">{label}</Text>
    <Text className="flex-1 font-medium">{value || "Not provided"}</Text>
  </View>
);

export default function SecurityIncidentDetailsPage() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: incident, isLoading, error } = useSecurityIncidentDetails(id);
  const { closeIncident, isClosing, closeError } = useSecurityIncidentActions();
  const [showCloseModal, setShowCloseModal] = useState(false);

  const status = incident?.status;
  const isClosed = status === "Closed";
  const isCancelled = status === "Cancelled";
  const isActive = status === "Open";

  const handleClose = async (data: {
    closureNotes: string;
    closedBy: string;
  }) => {
    if (!incident) return;
    try {
      await closeIncident({
        id: incident.id,
        ...data,
      });
      setShowCloseModal(false);
    } catch (err) {
      console.error("Failed to close incident:", err);
    }
  };

  if (incident) {
    return (
      <>
        <ScrollView className="flex-1 bg-gray-50 p-4">
          <View className="rounded-lg bg-white p-4 shadow-sm">
            <View className="mb-4 border-b border-gray-200 pb-2">
              <Text className="text-xl font-bold">
                {t("security.incident.report_title")}
              </Text>
              <View className="mt-1 flex-row items-center justify-between">
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
                    {status}
                  </Text>
                </View>
                {isActive && (
                  <Button
                    onPress={() => setShowCloseModal(true)}
                    color="destructive"
                    className="ml-2"
                  >
                    {t("security.close_incident")}
                  </Button>
                )}
              </View>
              {closeError && (
                <Text className="mt-2 text-red-500">
                  {t("security.incident.failed_to_close")}
                </Text>
              )}
            </View>

            <DetailRow
              label={t("security.incident.date_called")}
              value={formatDate(incident.dateCalled)}
            />
            <DetailRow label={t("security.incident.status")} value={status} />
            <DetailRow
              label={t("security.incident.name")}
              value={
                incident.isAnonymous
                  ? t("security.incident.anonymous")
                  : incident.name
              }
            />
            <DetailRow
              label={t("security.incident.contact")}
              value={
                incident.isAnonymous
                  ? t("security.incident.anonymous")
                  : incident.contactNumber
              }
            />
            <DetailRow
              label={t("security.incident.location")}
              value={
                incident.location?.name ??
                (incident.isAnonymous
                  ? t("security.incident.anonymous")
                  : t("security.incident.not_provided"))
              }
            />
            {incident.roomNumber && (
              <DetailRow
                label={t("security.incident.room_number")}
                value={incident.roomNumber}
              />
            )}
            {incident.gpsCoordinates && (
              <DetailRow
                label={t("security.incident.gps_location")}
                value={`${incident.gpsCoordinates.coordinates.values[1]}, ${incident.gpsCoordinates.coordinates.values[0]}`}
              />
            )}

            {incident && isClosed && (
              <>
                <DetailRow
                  label={t("security.incident.date_closed")}
                  value={
                    incident.dateClosed
                      ? formatDate(incident.dateClosed)
                      : undefined
                  }
                />
                <DetailRow
                  label={t("security.incident.duration")}
                  value={
                    incident.dateClosed
                      ? formatDuration(incident.dateCalled, incident.dateClosed)
                      : undefined
                  }
                />
                <DetailRow
                  label={t("security.incident.closed_by")}
                  value={incident.closedBy}
                />
                <DetailRow
                  label={t("security.incident.closure_notes")}
                  value={incident.closureNotes}
                />
              </>
            )}

            {incident && isCancelled && (
              <>
                <DetailRow
                  label={t("security.incident.date_cancelled")}
                  value={formatDate(incident.dateClosed ?? new Date())}
                />
                <DetailRow
                  label={t("security.incident.duration")}
                  value={formatDuration(
                    incident.dateCalled,
                    incident.dateClosed,
                  )}
                />
                <DetailRow
                  label={t("security.incident.cancellation_reason")}
                  value={incident.cancellationReason}
                />
              </>
            )}
          </View>
          {incident.gpsCoordinates && (
            <View className="mt-4">
              <LocationMapView
                latitude={incident.gpsCoordinates?.coordinates.values[1]}
                longitude={incident.gpsCoordinates?.coordinates.values[0]}
              />
            </View>
          )}
        </ScrollView>

        <CloseIncidentModal
          isVisible={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onSubmit={handleClose}
          isSubmitting={isClosing}
          error={closeError}
        />
      </>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center py-20">
        <Text className="text-red-500">
          {t("security.error_loading_incident")}
        </Text>
        <Text className="mt-2 text-gray-500">{(error as Error).message}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-2">{t("security.loading_incident_details")}</Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-20">
      <Text className="text-gray-500">{t("security.incident_not_found")}</Text>
    </View>
  );
}
