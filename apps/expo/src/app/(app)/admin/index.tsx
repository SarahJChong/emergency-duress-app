import { Text, View } from "react-native";
import { Link } from "expo-router";
import type { RelativePathString } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/useAuth";

/**
 * Admin dashboard showing system overview and management options
 */
export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const adminFeatures = [
    {
      id: "locations",
      title: t("admin.features.locations.title"),
      description: t("admin.features.locations.description"),
      href: "/admin/locations" as RelativePathString,
    },
    // {
    //   id: "users",
    //   title: t("admin.features.users.title"),
    //   description: t("admin.features.users.description"),
    //   href: "/admin/users" as RelativePathString,
    // },
    // {
    //   id: "settings",
    //   title: t("admin.features.settings.title"),
    //   description: t("admin.features.settings.description"),
    //   href: "/admin/settings" as RelativePathString,
    // },
  ];

  return (
    <View className="flex-1 bg-white p-4">
      <View className="mb-6">
        <Text className="text-lg font-semibold">
          {t("admin.welcome", { name: user?.name })}
        </Text>
        <Text className="text-sm text-gray-600">{t("admin.subtitle")}</Text>
      </View>

      <FlashList
        data={adminFeatures}
        renderItem={({ item }) => (
          <Link href={item.href} asChild>
            <View className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Text className="text-lg font-medium">{item.title}</Text>
              <Text className="mt-1 text-gray-600">{item.description}</Text>
            </View>
          </Link>
        )}
        estimatedItemSize={100}
      />
    </View>
  );
}
