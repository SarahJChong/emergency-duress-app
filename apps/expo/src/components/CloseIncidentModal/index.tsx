import React from "react";
import { Modal, Text, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import Button from "@/components/Button";
import { FormInputField } from "@/components/FormField";
import { useAuth } from "@/hooks/useAuth";

interface CloseIncidentModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: { closureNotes: string; closedBy: string }) => Promise<void>;
  isSubmitting?: boolean;
  error?: Error | null;
}

/**
 * Modal component for closing an incident with notes
 */
export default function CloseIncidentModal({
  isVisible,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: CloseIncidentModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const formSchema = z.object({
    closureNotes: z.string().min(1, t("incidents.close.notes.required")),
  });

  const form = useForm({
    defaultValues: {
      closureNotes: "",
    },
    validators: {
      onBlur: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user?.name)
        return {
          status: "error",
          message: t("incidents.close.errors.user_not_found"),
        };

      await onSubmit({
        closureNotes: value.closureNotes,
        closedBy: user.name,
      });

      return { status: "success" };
    },
  });

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View className="flex-1 justify-center bg-black/50 p-4">
        <View className="rounded-lg bg-white p-4">
          <Text className="mb-4 text-lg font-medium">
            {t("incidents.close.title")}
          </Text>

          <form.Field name="closureNotes">
            {(field) => (
              <FormInputField
                label={t("incidents.close.notes.label")}
                isRequired
                isDisabled={isSubmitting}
                placeholder={t("incidents.close.notes.placeholder")}
                value={field.state.value}
                onChangeText={field.handleChange}
                errors={[
                  ...(error ? [error.message] : []),
                  ...field.state.meta.errors,
                ]}
                multiline
                numberOfLines={3}
                className="h-24"
              />
            )}
          </form.Field>

          <View className="mt-4 flex-row justify-end space-x-2">
            <Button
              onPress={onClose}
              variant="outline"
              color="primary"
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isFormSubmitting]) => (
                <Button
                  color="destructive"
                  onPress={!canSubmit ? undefined : form.handleSubmit}
                  disabled={isFormSubmitting || isSubmitting || !canSubmit}
                >
                  {isFormSubmitting || isSubmitting
                    ? t("incidents.close.button.closing")
                    : t("incidents.close.button.close")}
                </Button>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
