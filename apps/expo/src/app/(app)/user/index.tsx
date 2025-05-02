import React, { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, LI, Main, UL } from "@expo/html-elements";
import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";
import colors from "tailwindcss/colors";

import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { useIncidentActions } from "@/hooks/useIncidentActions";
import { useIncidentStatus } from "@/hooks/useIncidentStatus";
import { useMeQuery } from "@/hooks/useQueries";

const initiatePhoneCall = async (phoneNumber: string | undefined) => {
  if (!phoneNumber) {
    console.error("No emergency contact number available");
    return;
  }

  try {
    const telUrl = `tel:${phoneNumber.replace(/\D/g, "")}`;
    const supported = await Linking.canOpenURL(telUrl);

    if (!supported) {
      console.error("Phone calls are not supported on this device");
      return;
    }

    await Linking.openURL(telUrl);
  } catch (error) {
    console.error("Error making phone call:", error);
  }
};

export default function Index() {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonInvalid, setCancelReasonInvalid] = useState(false);

  const { isSignedIn, user } = useAuth();
  const userQuery = useMeQuery(isSignedIn);

  const { inDuress, isAnonymous, setIsAnonymous } = useIncidentStatus();
  const { raiseIncident, cancelIncident, isRaising, isCancelling } =
    useIncidentActions();

  const handleAlertClose = () => setShowAlertDialog(false);

  const handleAlertConfirm = async () => {
    if (!cancelReason) {
      setCancelReasonInvalid(true);
      return;
    }

    await cancelIncident(cancelReason);
    setShowAlertDialog(false);
    setCancelReason("");
  };

  const handleDuressCallPress = async () => {
    if (!isSignedIn) {
      console.error("User is not signed in");
      return;
    }

    const defaultPhoneNumber = userQuery.data?.location?.defaultPhoneNumber;

    // Initiate phone call first (offline-first approach)
    await initiatePhoneCall(defaultPhoneNumber);

    // Attempt to create incident
    await raiseIncident({ isAnonymous });
  };

  // Get user data from the cached query
  const userData = userQuery.data;

  return (
    <Main>
      <SafeAreaView>
        <View className="flex items-center gap-10 p-6">
          <View className="w-full rounded-md bg-white px-8 py-4 shadow-lg">
            <UL>
              <LI className="flex flex-row items-center">
                <Text
                  className="mb-2 overflow-hidden"
                  accessibilityLabelledBy="name"
                >
                  <H1 className="">
                    {isAnonymous ? t("user.anonymous") : `${user?.name}`}
                  </H1>
                </Text>
              </LI>
              <LI className="flex flex-row items-center">
                <Text nativeID="mobile" className="text-sm text-gray-500">
                  {t("user.mobile")}:{" "}
                </Text>
                <Text
                  className="text-base font-semibold"
                  accessibilityLabelledBy="name"
                >
                  {isAnonymous ? t("user.anonymous") : userData?.contactNumber}
                </Text>
              </LI>
              <LI className="flex flex-row items-center">
                <Text nativeID="site" className="text-sm text-gray-500">
                  {t("user.site")}:{" "}
                </Text>
                <Text
                  className="text-base font-semibold"
                  accessibilityLabelledBy="site"
                >
                  {userData?.location?.name}
                </Text>
              </LI>
              {!isAnonymous && userData?.roomNumber ? (
                <LI className="flex flex-row items-center">
                  <Text nativeID="room" className="text-sm text-gray-500">
                    {t("user.room")}:{" "}
                  </Text>
                  <Text
                    className="text-base font-semibold"
                    accessibilityLabelledBy="room"
                  >
                    {userData.roomNumber}
                  </Text>
                </LI>
              ) : null}
            </UL>

            <View className="mt-8">
              <Pressable
                role="button"
                className={cn(
                  "flex flex-row items-center justify-center gap-4 rounded-md bg-red-600 px-3 py-4 text-white",
                  {
                    "animate-pulse bg-red-300": inDuress,
                    "opacity-50": isRaising,
                  },
                )}
                onPress={handleDuressCallPress}
                disabled={inDuress || isRaising}
              >
                <Ionicons name="call" size={24} color={colors.white} />
                <Text className="text-base font-semibold text-white">
                  {isRaising
                    ? t("user.emergency_call.creating")
                    : inDuress
                      ? t("user.emergency_call.active")
                      : t("user.emergency_call.default")}
                </Text>
              </Pressable>
            </View>
            <View className="mb-4 mt-8 flex flex-row items-center justify-end gap-4">
              <Text
                className="mr-2 text-sm text-gray-500"
                nativeID="anonymousSwitchLabel"
              >
                {t("user.anonymize_label")}
              </Text>
              <Switch
                className="scale-150 transform"
                trackColor={{
                  false: inDuress ? colors.neutral[100] : colors.neutral[300],
                  true: inDuress ? colors.neutral[100] : colors.neutral[600],
                }}
                thumbColor={inDuress ? colors.neutral[50] : colors.neutral[50]}
                {...Platform.select({
                  web: {
                    activeThumbColor: inDuress
                      ? colors.neutral[50]
                      : colors.neutral[50],
                  },
                })}
                ios_backgroundColor={colors.neutral[300]}
                onValueChange={setIsAnonymous}
                value={isAnonymous}
                accessibilityLabelledBy="anonymousSwitchLabel"
                accessibilityLabel="Anonymize my name and mobile"
                accessibilityRole="switch"
                aria-checked={isAnonymous}
                accessibilityState={{ checked: isAnonymous }}
                disabled={inDuress}
              />
            </View>
          </View>

          {inDuress ? (
            <Pressable
              role="button"
              className="flex w-full flex-row items-center justify-center gap-4 rounded-md bg-yellow-500 px-3 py-4 text-white"
              onPress={() => setShowAlertDialog(true)}
            >
              <Ionicons name="close" size={24} color={colors.black} />
              <Text className="text-base font-semibold text-black">
                {t("user.cancel_emergency.title")}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAlertDialog}
        >
          <View
            className="flex flex-1 flex-col items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          >
            <View className="items-center rounded-lg bg-white p-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-red-500">
                <Ionicons
                  name="alert-outline"
                  size={32}
                  color={colors.red[200]}
                />
              </View>
              <H1 className="mb-2 text-lg">
                {t("user.cancel_emergency.title")}
              </H1>
              <Text className="text-center text-base">
                {t("user.cancel_emergency.confirmation")}
              </Text>

              <TextInput
                keyboardType="default"
                placeholder={t("user.cancel_emergency.reason_placeholder")}
                onChangeText={(text) => setCancelReason(text)}
                onFocus={() => setCancelReasonInvalid(false)}
                multiline
                className={cn(
                  "mt-4 w-full rounded-md border border-gray-300 p-2 placeholder:text-gray-500",
                  {
                    "border-red-500": cancelReasonInvalid,
                  },
                )}
              />
              {cancelReasonInvalid ? (
                <View className="mt-2 flex flex-row items-center gap-2">
                  <Ionicons
                    name="alert-circle-outline"
                    size={24}
                    color={colors.red[500]}
                  />
                  <Text className="text-sm text-red-500">
                    {t("user.cancel_emergency.reason_required")}
                  </Text>
                </View>
              ) : null}

              <View className="mt-4 flex flex-row items-center gap-4">
                <Pressable
                  role="button"
                  onPress={handleAlertClose}
                  className="rounded-md bg-gray-300 px-4 py-2"
                >
                  <Text className="text-base text-neutral-800">
                    {t("user.cancel_emergency.cancel_button")}
                  </Text>
                </Pressable>
                <Pressable
                  role="button"
                  onPress={handleAlertConfirm}
                  className="rounded-md bg-red-500 px-4 py-2"
                  disabled={isCancelling}
                >
                  <Text className="text-base text-white">
                    {isCancelling
                      ? t("user.cancel_emergency.cancelling")
                      : t("user.cancel_emergency.confirm_button")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Main>
  );
}
