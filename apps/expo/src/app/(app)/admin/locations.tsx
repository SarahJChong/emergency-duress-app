import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { H1, Main } from "@expo/html-elements";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import Button from "@/components/Button";
import Loading from "@/components/Loading";
import LocationModal from "@/components/LocationModal";
import SecurityRespondersModal from "@/components/SecurityRespondersModal";
import { useLocations } from "@/hooks/useLocations";
import type { ApiLocation, LocationInput } from "@/lib/api";

/**
 * Location management screen for administrators
 */
export default function LocationsManagement() {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] =
    React.useState<ApiLocation | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] =
    React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    locations,
    isLoading,
    create,
    update,
    delete: deleteLocation,
    isLocationIncidentError,
  } = useLocations();

  const handleCreateLocation = async (data: LocationInput) => {
    try {
      await create(data);
      setStatusMessage({
        type: "success",
        text: t("locations.create_success"),
      });
      setIsModalVisible(false);
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: isLocationIncidentError(error)
          ? error.message
          : t("locations.create_failure"),
      });
    }
  };

  const handleUpdateLocation = async (data: LocationInput) => {
    if (!selectedLocation) return;

    try {
      await update({ id: selectedLocation.id, data });
      setStatusMessage({
        type: "success",
        text: t("locations.update_success"),
      });
      setIsModalVisible(false);
      setSelectedLocation(null);
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: isLocationIncidentError(error)
          ? error.message
          : t("locations.update_failure"),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const location = locations.find((loc) => loc.id === id);
    if (!location) return;

    try {
      await deleteLocation(id);
      setStatusMessage({
        type: "success",
        text: t("locations.delete_success"),
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: isLocationIncidentError(error)
          ? error.message
          : t("locations.delete_failure"),
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScrollView className="bg-white p-4">
      <Stack.Screen options={{ title: t("locations.title") }} />
      <Main>
        <H1>{t("locations.title")}</H1>
        <Text className="mb-6 text-sm text-gray-600">
          {t("locations.subtitle")}
        </Text>

        {/* Status Message */}
        {statusMessage && (
          <View
            className={`mb-4 rounded-lg p-2 ${
              statusMessage.type === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={
                statusMessage.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Add Location Button */}
        <View className="mb-4">
          <Button
            onPress={() => {
              setSelectedLocation(null);
              setIsModalVisible(true);
              setStatusMessage(null);
            }}
            className="text-white"
          >
            {t("locations.add_button")}
          </Button>
        </View>

        {/* Locations List */}
        <View className="flex-1">
          {locations && locations.length > 0 ? (
            <FlashList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View>
                        <Text className="text-lg font-medium">{item.name}</Text>
                        <Text className="text-sm text-gray-600">
                          {t("locations.phone")}: {item.defaultPhoneNumber}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {t("locations.email")}: {item.defaultEmail}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center space-x-2">
                      {item.hasIncidents ? (
                        <View className="absolute -top-6 left-0 right-0 w-full flex-row items-center justify-center">
                          <Ionicons
                            name="lock-closed"
                            size={16}
                            color="#6B7280"
                          />
                          <Text className="ml-2 text-sm text-gray-500">
                            {t("locations.locked")}
                          </Text>
                        </View>
                      ) : null}
                      <Button
                        onPress={() => {
                          setSelectedLocation(item);
                          setIsSecurityModalVisible(true);
                          setStatusMessage(null);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        {t("locations.manage_security")}
                      </Button>
                      <View>
                        <View className="flex-row items-center space-x-2">
                          <Button
                            onPress={() => {
                              setSelectedLocation(item);
                              setIsModalVisible(true);
                              setStatusMessage(null);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            {t("locations.edit_button")}
                          </Button>
                          <Button
                            disabled={item.hasIncidents}
                            onPress={() => handleDelete(item.id)}
                            color="destructive"
                            variant="outline"
                            size="sm"
                          >
                            {t("locations.delete_button")}
                          </Button>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              estimatedItemSize={100}
            />
          ) : (
            <Text className="text-center text-gray-500">
              {t("locations.no_locations")}
            </Text>
          )}
        </View>

        {/* Location Modal */}
        <LocationModal
          isVisible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setStatusMessage(null);
            setSelectedLocation(null);
          }}
          onSubmit={
            selectedLocation ? handleUpdateLocation : handleCreateLocation
          }
          location={selectedLocation}
          isNameDisabled={selectedLocation?.hasIncidents ?? false}
        />

        {/* Security Responders Modal */}
        {selectedLocation && (
          <SecurityRespondersModal
            isVisible={isSecurityModalVisible}
            onClose={() => {
              setIsSecurityModalVisible(false);
            }}
            location={selectedLocation}
          />
        )}
      </Main>
    </ScrollView>
  );
}
