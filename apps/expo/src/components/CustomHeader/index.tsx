import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Href, Link, useRouter } from "expo-router";
import { Nav } from "@expo/html-elements";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "zeego/dropdown-menu";

import { cn } from "@/utils/cn";
import { env } from "@/env";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface CustomHeaderProps {
  title: string;
  href?: Href;
}
const CustomHeader = ({ title, href }: CustomHeaderProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { registerForPushNotificationsAsync } = usePushNotifications();

  const onPress = () => {
    if (!href) {
      router.back();
      return;
    }
    router.dismissTo(href);
  };

  return (
    <Nav>
      <View className="flex h-[64px] flex-row items-center bg-primary">
        <Pressable
          className="flex-1 cursor-pointer flex-row items-center"
          onPress={onPress}
          accessibilityLabel={!href ? t("common.back") : undefined}
        >
          <Image
            source={require("../../../assets/images/icon.png")}
            className="my-2 ml-4 mr-2 size-10"
            accessibilityLabel={t("header.brand_icon.aria_label")}
            contentFit="cover"
          />
          <Text className="flex-1 text-lg font-bold text-white">{title}</Text>
        </Pressable>
        <View className="flex-row items-center gap-2 px-4">
          <Pressable
            className="cursor-pointer rounded-md bg-white/10 px-2 py-1"
            onPress={async () => {
              try {
                await registerForPushNotificationsAsync();
                console.log("Successfully registered for push notifications");
              } catch (error) {
                console.error("Failed to register for notifications:", error);
              }
            }}
            accessibilityLabel={t("common.enable_notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
          </Pressable>
          <HeaderDropDownMenu />
        </View>
      </View>
    </Nav>
  );
};

export default CustomHeader;

const style = StyleSheet.create({
  content: {
    ...Platform.select({
      web: {
        animationDuration: "400ms",
        animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform, opacity",
        animationKeyframes: {
          "0%": { opacity: 0, transform: [{ scale: 0.5 }] },
          "100%": { opacity: 1, transform: [{ scale: 1 }] },
        },
        boxShadow:
          "0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
        transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
      },
    }),
  },
});

type ContentProps = React.ComponentProps<(typeof DropdownMenu)["Content"]>;

export const DropdownMenuContent = DropdownMenu.create(
  (props: ContentProps) => {
    return (
      <DropdownMenu.Content
        {...props}
        style={style.content}
        className="min-w-56 rounded-md border border-gray-300 bg-white px-2 py-1"
      />
    );
  },
  "Content",
);

type ItemProps = React.ComponentProps<(typeof DropdownMenu)["Item"]>;

const DropdownMenuItem = DropdownMenu.create((props: ItemProps) => {
  return (
    <DropdownMenu.Item
      {...props}
      className={cn(
        "flex h-8 cursor-pointer flex-row items-center gap-2 rounded-sm px-2 py-2 leading-none hover:bg-gray-200",
        props.className,
      )}
    >
      {props.children}
    </DropdownMenu.Item>
  );
}, "Item");

const HeaderDropDownMenu = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable
          className="opacity-80"
          accessibilityLabel={t("header.menu.aria_label")}
          role="button"
        >
          {({ pressed }) => (
            <View className={cn(pressed ? "opacity-50" : "opacity-90")}>
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </View>
          )}
        </Pressable>
      </DropdownMenu.Trigger>

      <DropdownMenuContent>
        <DropdownMenuItem
          key="resources"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          placeholder=""
          onSelect={async () => {
            await Linking.openURL(env.EXPO_PUBLIC_RESOURCES_URL);
          }}
        >
          <Ionicons name="albums-outline" size={24} />
          <DropdownMenu.ItemTitle>
            {t("header.resources")}
          </DropdownMenu.ItemTitle>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="privacy"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          placeholder=""
          onSelect={async () => {
            router.push("/privacy");
          }}
        >
          <Ionicons name="shield-outline" size={24} />
          <DropdownMenu.ItemTitle>
            {t("header.privacy_policy")}
          </DropdownMenu.ItemTitle>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="terms"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          placeholder=""
          onSelect={async () => {
            router.push("/terms");
          }}
        >
          <Ionicons name="document-text-outline" size={24} />
          <DropdownMenu.ItemTitle>{t("header.terms")}</DropdownMenu.ItemTitle>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="sign-out"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          placeholder=""
          onSelect={signOut}
          className="text-red-500"
        >
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <DropdownMenu.ItemTitle>
            {t("common.sign_out")}
          </DropdownMenu.ItemTitle>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu.Root>
  );
};
