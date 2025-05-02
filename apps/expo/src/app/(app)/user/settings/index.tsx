import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Href, Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/cn";

type IoniconsName = keyof typeof Ionicons.glyphMap;

type SettingsItemProps = {
  name: string;
  icon: IoniconsName;
  iconClassName?: string;
  route: Href;
};

const SettingsPages: SettingsItemProps[] = [
  {
    name: "settings.menu.profile",
    icon: "person-circle",
    iconClassName: "text-blue-600",
    route: "/user/settings/profile",
  },
  {
    name: "settings.menu.past_incidents",
    icon: "list-circle",
    iconClassName: "text-red-600",
    route: "/user/settings/incidents",
  },
  {
    name: "settings.menu.diagnostics",
    icon: "shield-checkmark",
    iconClassName: "text-green-600",
    route: "/user/settings/diagnostics",
  },
];

const SetttingsItem = ({
  name,
  icon,
  route,
  iconClassName,
}: SettingsItemProps) => {
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);
  return (
    <Link href={route} asChild>
      <Pressable
        className={cn(
          "min-h-[44px] w-full flex-row items-center hover:bg-gray-100",
          isPressed ? "bg-gray-100" : "",
        )}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
      >
        <Ionicons name={icon} size={32} className={cn("mx-4", iconClassName)} />

        <View className="flex flex-1 flex-row border-b-[0.55px] border-gray-300 pr-4">
          <Text className="my-3 text-lg">{t(name)}</Text>
          <View className="ml-auto">
            <Ionicons
              name="chevron-forward-outline"
              size={22}
              className="my-3 text-gray-400"
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

export default function Page() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerTitle: t("settings.title") }} />
      <View className="h-full bg-white">
        <FlashList
          data={SettingsPages}
          renderItem={({ item }) => <SetttingsItem {...item} />}
          estimatedItemSize={200}
        />
      </View>
    </>
  );
}
