import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Image } from "expo-image";
import { H1 } from "@expo/html-elements";

const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Image
        source={require("@/../assets/images/icon.png")}
        className="m-2 size-20"
        accessibilityLabel="brand icon"
        contentFit="cover"
      />
      <H1 className="animate-bounce text-primary">Loading...</H1>
      <ActivityIndicator
        size="large"
        className="text-primary"
        aria-label="Loading spinner"
      />
    </View>
  );
};

export default LoadingScreen;
