import React from "react";
import { ScrollView, Text, View } from "react-native";
import { H1, Main } from "@expo/html-elements";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Button from "@/components/Button";
import { FormCheckboxField } from "@/components/FormField/FormCheckboxField";
import { useErrorLogging } from "@/hooks/useErrorLogging";

const formSchema = z.object({
  allowErrorLogging: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DiagnosticsPage() {
  const { t } = useTranslation();
  const { hasConsent, updateConsent } = useErrorLogging();

  const form = useForm<FormValues>({
    defaultValues: {
      allowErrorLogging: hasConsent ?? false,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await updateConsent(value.allowErrorLogging);
    },
  });

  return (
    <ScrollView className="gap-10 p-6">
      <Main>
        <H1 className="mb-6">{t("settings.diagnostics.title")}</H1>

        <View className="space-y-4">
          <View className="rounded-lg bg-white p-4 shadow-sm">
            <Text className="mb-4 text-base font-medium text-gray-900">
              {t("settings.diagnostics.anonymous_data_collection")}
            </Text>

            <form.Field name="allowErrorLogging">
              {(field) => (
                <FormCheckboxField
                  aria-label="allowErrorLogging"
                  errors={field.state.meta.errors}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  containerClass="mb-4"
                >
                  <View>
                    <Text className="text-sm text-gray-700">
                      {t("settings.diagnostics.help_text")}
                    </Text>
                    <Text className="mt-2 text-xs text-gray-500">
                      {t("settings.diagnostics.privacy_note")}
                    </Text>
                  </View>
                </FormCheckboxField>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onPress={!canSubmit ? undefined : form.handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                  className="text-white"
                >
                  {isSubmitting
                    ? t("settings.diagnostics.saving")
                    : t("settings.diagnostics.save_button")}
                </Button>
              )}
            />
          </View>
        </View>
      </Main>
    </ScrollView>
  );
}
