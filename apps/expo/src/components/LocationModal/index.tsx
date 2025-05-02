import React from "react";
import { Modal, Text, View } from "react-native";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import Button from "@/components/Button";
import { FormInputField } from "@/components/FormField";
import type { ApiLocation, LocationInput } from "@/lib/api";

const formSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  defaultPhoneNumber: z.string().min(1, "Default phone number is required"),
  defaultEmail: z
    .string()
    .email("Invalid email address")
    .min(1, "Default email is required"),
});

interface LocationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (values: LocationInput) => Promise<void>;
  location?: ApiLocation | null;
  isNameDisabled?: boolean;
}

/**
 * Modal component for adding or editing locations
 */
export default function LocationModal({
  isVisible,
  onClose,
  onSubmit,
  location,
  isNameDisabled = false,
}: LocationModalProps) {
  const isEditing = !!location;

  const form = useForm({
    defaultValues: {
      name: location?.name ?? "",
      defaultPhoneNumber: location?.defaultPhoneNumber ?? "",
      defaultEmail: location?.defaultEmail ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      return { status: "success" };
    },
  });

  // Reset form when location changes
  React.useEffect(() => {
    form.reset({
      name: location?.name ?? "",
      defaultPhoneNumber: location?.defaultPhoneNumber ?? "",
      defaultEmail: location?.defaultEmail ?? "",
    });
  }, [location]);

  // Reset form when modal opens with no location
  React.useEffect(() => {
    if (isVisible && !location) {
      form.reset({
        name: "",
        defaultPhoneNumber: "",
        defaultEmail: "",
      });
    }
  }, [isVisible]);

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View className="flex-1 justify-center bg-black/50 p-4">
        <View className="rounded-lg bg-white p-4">
          <Text className="mb-4 text-lg font-medium">
            {isEditing ? "Edit Location" : "Add New Location"}
          </Text>

          <form.Field name="name">
            {(field) => (
              <FormInputField
                label="Location Name"
                isRequired
                isDisabled={isNameDisabled}
                placeholder="Enter location name"
                value={field.state.value}
                onChangeText={field.handleChange}
                errors={field.state.meta.errors}
              />
            )}
          </form.Field>

          <form.Field name="defaultPhoneNumber">
            {(field) => (
              <FormInputField
                label="Default Phone Number"
                isRequired
                placeholder="Enter default phone number"
                value={field.state.value}
                onChangeText={field.handleChange}
                errors={field.state.meta.errors}
                keyboardType="phone-pad"
              />
            )}
          </form.Field>

          <form.Field name="defaultEmail">
            {(field) => (
              <FormInputField
                label="Default Email"
                isRequired
                placeholder="Enter default email"
                value={field.state.value}
                onChangeText={field.handleChange}
                errors={field.state.meta.errors}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </form.Field>

          <View className="mt-4 flex-row justify-end space-x-2">
            <Button onPress={onClose} className="mr-2" variant="outline">
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onPress={!canSubmit ? undefined : form.handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting
                    ? isEditing
                      ? "Updating..."
                      : "Adding..."
                    : isEditing
                      ? "Update Location"
                      : "Add Location"}
                </Button>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
