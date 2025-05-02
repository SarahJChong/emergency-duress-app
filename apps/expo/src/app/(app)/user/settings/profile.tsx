import React from "react";
import { ScrollView, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { H1, Main } from "@expo/html-elements";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Button from "@/components/Button";
import { FormInputField, FormSelectField } from "@/components/FormField";
import LoadingScreen from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useLocationsQuery, useMeQuery } from "@/hooks/useQueries";
import { updateUser } from "@/lib/api";

const formSchema = z.object({
  mobileNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Invalid mobile number. Please use the following format +61400000123",
    ),
  location: z.string().nonempty("Site/Camp is required."),
  roomNumber: z.string().optional(),
});

export default function Page() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isSignedIn, user } = useAuth();
  const queryClient = useQueryClient();

  const userQuery = useMeQuery(isSignedIn);
  const locationsQuery = useLocationsQuery();

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const form = useForm({
    defaultValues: {
      mobileNumber: userQuery.data?.contactNumber || "",
      location: userQuery.data?.location?.id || "",
      roomNumber: userQuery.data?.roomNumber || "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        roomNumber: value.roomNumber,
        contactNumber: value.mobileNumber,
        locationId: value.location,
      });
      router.navigate("/");
    },
  });

  const onUpdatePress = () => {
    form.handleSubmit();
  };
  if (userQuery.data) {
    return (
      <ScrollView className="gap-10 p-6">
        <Stack.Screen
          options={{
            headerTitle: t("settings.profile.title"),
            headerBackButtonMenuEnabled: true,
          }}
        />
        <Main>
          <H1>{t("settings.profile.title")}</H1>

          <Text className="mb-4">{user?.name || userQuery.data?.name}</Text>

          <form.Field name="mobileNumber">
            {(field) => (
              <FormInputField
                label={t("settings.profile.mobile_label")}
                isRequired
                errors={field.state.meta.errors}
                value={field.state.value}
                onChangeText={field.handleChange}
                placeholder={t("settings.profile.mobile_placeholder")}
                keyboardType="phone-pad"
              />
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <FormSelectField
                label={t("settings.profile.location_label")}
                isRequired
                errors={field.state.meta.errors}
                value={field.state.value}
                onChange={field.handleChange}
                options={
                  locationsQuery.data?.map((location) => ({
                    label: location.name,
                    value: location.id,
                  })) ?? []
                }
              />
            )}
          </form.Field>

          <form.Field name="roomNumber">
            {(field) => (
              <FormInputField
                label={t("settings.profile.room_label")}
                errors={field.state.meta.errors}
                value={field.state.value}
                onChangeText={field.handleChange}
                placeholder={t("settings.profile.room_placeholder")}
                keyboardType="decimal-pad"
              />
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                onPress={!canSubmit ? undefined : onUpdatePress}
                disabled={isSubmitting || !canSubmit}
                className="text-white"
              >
                {isSubmitting
                  ? t("settings.profile.updating")
                  : t("settings.profile.update_button")}
              </Button>
            )}
          />
        </Main>
      </ScrollView>
    );
  }

  if (userQuery.isPending) {
    return <LoadingScreen />;
  }
}
