import React from "react";
import { ScrollView, Text } from "react-native";
import { Stack } from "expo-router";
import { H1, Main } from "@expo/html-elements";
import { useTranslation } from "react-i18next";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("privacy.title"),
        }}
      />

      <ScrollView className="gap-10 p-6">
        <Main>
          <H1 className="mb-6">{t("privacy.title")}</H1>
          <Text className="whitespace-pre-wrap text-base text-gray-700">
            {t("privacy.content")}
          </Text>
        </Main>
      </ScrollView>
    </>
  );
}
