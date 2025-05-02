import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { H1, H2 } from "@expo/html-elements";
import { Ionicons } from "@expo/vector-icons";
import colors from "tailwindcss/colors";

import Button from "@/components/Button";
import { env } from "@/env";
import { useAuth } from "@/hooks/useAuth";

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const emergencyPhoneNumber = env.EXPO_PUBLIC_EMERGENCY_PHONE_NUMBER;

  const { signIn, isLoading, isSignedIn } = useAuth();

  const onContinuePress = () => {
    signIn();
  };

  if (isSignedIn) {
    return <Redirect href="/register" />;
  }

  return (
    <ScrollView className="bg-primary">
      <SafeAreaView>
        <View className="my-4 flex-1 items-center justify-center">
          <Image
            source={require("@/../assets/images/icon.png")}
            className="m-2 size-16"
            contentFit="cover"
            accessibilityLabel="brand icon"
          />
          <H1 className="m-0 text-white">Emergency Duress</H1>
        </View>
        <View className="m-4 gap-4 rounded-lg bg-white p-6 shadow-lg">
          <H2 className="my-0">Login</H2>

          <Button
            onPress={onContinuePress}
            className="text-white"
            disabled={isSignedIn || isLoading}
          >
            Sign In with Identity Provider
          </Button>
        </View>
        <View className="m-4 gap-4 rounded-lg bg-white p-6 shadow-lg">
          <Text className="text-center">
            <H2 className="mb-0">Call for security now</H2>
          </Text>
          <Button
            onPress={() => {
              Linking.openURL(`tel:${emergencyPhoneNumber}`);
            }}
            className="flex w-full flex-row items-center justify-center gap-4 bg-red-500 text-white"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons
                name="call"
                size={20}
                color={colors.white}
                className="self-center"
              />
              <Text className="text-base font-medium text-white">
                Emergency Call
              </Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
