import React, { useEffect } from "react";
import { ScrollView, Text } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { A, H1, H2, Main } from "@expo/html-elements";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import Button from "@/components/Button";
import { FormInputField, FormSelectField } from "@/components/FormField";
import { FormCheckboxField } from "@/components/FormField/FormCheckboxField";
import LoadingScreen from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useLocationsQuery, useMeQuery } from "@/hooks/useQueries";
import { registerUser } from "@/lib/api";

const formSchema = z.object({
  mobileNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Invalid mobile number. Please use the following format +61400000123",
    ),
  location: z.string().nonempty("Site/Camp is required."),
  roomNumber: z.string().optional(),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "Terms and privacy must be accepted.",
  }),
});

export default function Page() {
  const router = useRouter();
  const { isSignedIn, user, error: authError } = useAuth();
  const queryClient = useQueryClient();

  const userQuery = useMeQuery(isSignedIn);
  const locationsQuery = useLocationsQuery();

  const form = useForm({
    defaultValues: {
      mobileNumber: userQuery.data?.contactNumber ?? "",
      location: "",
      roomNumber: userQuery.data?.roomNumber ?? "",
      termsAccepted: false,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync({
        roomNumber: value.roomNumber,
        contactNumber: value.mobileNumber,
        locationId: value.location,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/");
    },
  });

  const onRegisterPress = () => {
    form.handleSubmit();
  };

  useEffect(() => {
    if (registerMutation.isSuccess) {
      router.replace("/");
    }
  }, [registerMutation.isSuccess]);

  if (userQuery.data?.location) {
    return <Redirect href="/" />;
  }

  if (userQuery.isLoading || locationsQuery.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView className="gap-10 p-6">
      <Main>
        <H1>Register</H1>

        <Text className="mb-4">
          <H2>{user?.name || userQuery.data?.name}</H2>
        </Text>

        <form.Field name="mobileNumber">
          {(field) => (
            <FormInputField
              label="Mobile"
              isRequired
              errors={field.state.meta.errors}
              onChangeText={field.handleChange}
              value={field.state.value}
              placeholder="+61400000123"
              keyboardType="phone-pad"
            />
          )}
        </form.Field>

        <form.Field name="location">
          {(field) => (
            <FormSelectField
              label="Location"
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
              label="Room No."
              errors={field.state.meta.errors}
              onChangeText={field.handleChange}
              value={field.state.value}
              placeholder="Optional"
              keyboardType="decimal-pad"
            />
          )}
        </form.Field>

        <form.Field name="termsAccepted">
          {(field) => (
            <FormCheckboxField
              errors={field.state.meta.errors}
              value={field.state.value}
              onValueChange={field.handleChange}
              containerClass="mb-12"
            >
              Accept{" "}
              <A
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline hover:no-underline active:opacity-70"
              >
                Terms and Conditions
              </A>{" "}
              and{" "}
              <A
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline hover:no-underline active:opacity-70"
              >
                Privacy Policy
              </A>
            </FormCheckboxField>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              onPress={!canSubmit ? undefined : onRegisterPress}
              disabled={isSubmitting || !canSubmit}
              className="text-white"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          )}
        />
      </Main>
    </ScrollView>
  );
}
