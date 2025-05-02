import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "tailwindcss/colors";

type OfflineBannerProps = {
  isVisible: boolean;
};

const OfflineBanner = ({ isVisible }: OfflineBannerProps) => {
  if (!isVisible) return null;

  return (
    <View className="flex-row items-center justify-center bg-yellow-500 p-2">
      <Ionicons name="cloud-offline" size={18} color={colors.black} />
      <Text className="text-back ml-2 text-center">
        You are offline. Some features may be limited.
      </Text>
    </View>
  );
};

export default OfflineBanner;
