import React, { useState } from "react";
import { Text, View } from "react-native";

import Button from "@/components/Button";
import { FormControl } from "@/components/FormControl/FormControl";
import { FormControlError } from "@/components/FormControl/FormControlError";
import { FormControlErrorText } from "@/components/FormControl/FormControlErrorText";
import Input from "@/components/Input";
import { useLocations } from "@/hooks/useLocations";
import type { ApiLocation, SecurityResponder } from "@/lib/api/types";

type Props = {
  location: ApiLocation;
};

/**
 * Component for managing security responders for a location
 */
export function SecurityRespondersList({ location }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [assignedResponders, setAssignedResponders] = useState<
    SecurityResponder[]
  >(location.securityResponders);
  const [searchText, setSearchText] = useState("");

  const {
    addSecurityResponder,
    removeSecurityResponder,
    isAddingResponder,
    isRemovingResponder,
    securityResponders,
    isLoadingResponders,
  } = useLocations();

  // Filter out already assigned responders and apply search filter
  const availableResponders = securityResponders.filter((responder) => {
    const isAssigned = assignedResponders.some(
      (assigned) => assigned.id === responder.id,
    );
    const matchesSearch =
      !searchText ||
      responder.name.toLowerCase().includes(searchText.toLowerCase()) ||
      responder.email.toLowerCase().includes(searchText.toLowerCase());

    return !isAssigned && matchesSearch;
  });

  const handleAdd = async (responder: SecurityResponder) => {
    try {
      setError(null);

      // Optimistically update UI
      setAssignedResponders((current) => [...current, responder]);

      await addSecurityResponder({
        locationId: location.id,
        email: responder.email,
      });
    } catch (err) {
      // Revert optimistic update on error
      setAssignedResponders((current) =>
        current.filter((r) => r.id !== responder.id),
      );

      setError(
        err instanceof Error ? err.message : "Failed to add security responder",
      );
    }
  };

  const handleRemove = async (responder: SecurityResponder) => {
    try {
      setError(null);

      // Optimistically update UI
      setAssignedResponders((current) =>
        current.filter((r) => r.id !== responder.id),
      );

      await removeSecurityResponder({
        locationId: location.id,
        email: responder.email,
      });
    } catch (err) {
      // Revert optimistic update on error
      setAssignedResponders((current) => [...current, responder]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove security responder",
      );
    }
  };

  return (
    <View className="space-y-4">
      <View>
        <Text className="text-lg font-medium">Manage Security Responders</Text>
        <Text className="text-sm text-gray-600">
          Search and manage security responders for this location
        </Text>
      </View>

      {/* Search available responders */}
      <View className="space-y-2">
        <FormControl>
          <Input
            testID="security-responder-search"
            placeholder="Search security responders"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </FormControl>

        {/* Available responders list */}
        <Text className="mt-4 font-medium">Available Security Responders</Text>
        <View className="max-h-48 rounded border border-gray-200 bg-gray-50 p-2">
          {isLoadingResponders ? (
            <Text className="text-gray-500">Loading responders...</Text>
          ) : availableResponders.length === 0 ? (
            <Text className="text-gray-500">No security responders found</Text>
          ) : (
            availableResponders.map((responder) => (
              <View
                key={responder.id}
                testID={`available-responder-${responder.id}`}
                className="flex-row items-center justify-between border-b border-gray-200 p-2 last:border-b-0"
              >
                <Text>
                  {responder.name} ({responder.email})
                </Text>
                <Button
                  testID={`add-responder-${responder.id}`}
                  accessibilityLabel={`Add ${responder.name}`}
                  onPress={() => handleAdd(responder)}
                  disabled={isAddingResponder}
                  size="sm"
                >
                  Add
                </Button>
              </View>
            ))
          )}
        </View>
      </View>

      {error ? (
        <FormControl isInvalid={true}>
          <FormControlError>
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        </FormControl>
      ) : null}

      {/* List of assigned responders */}
      <View className="space-y-2">
        <Text className="font-medium">Assigned Security Responders</Text>
        {assignedResponders.length === 0 ? (
          <Text className="italic text-gray-500">
            No security responders assigned
          </Text>
        ) : (
          assignedResponders.map((responder) => (
            <View
              key={responder.id}
              testID={`assigned-responder-${responder.id}`}
              className="flex-row items-center justify-between rounded bg-gray-50 p-2"
            >
              <View>
                <Text className="font-medium">{responder.name}</Text>
                <Text className="text-sm text-gray-600">{responder.email}</Text>
              </View>
              <Button
                testID={`remove-responder-${responder.id}`}
                accessibilityLabel={`Remove ${responder.name}`}
                accessibilityHint="Remove this security responder from the location"
                onPress={() => handleRemove(responder)}
                disabled={isRemovingResponder}
                variant="outline"
                color="destructive"
                size="xs"
              >
                Remove
              </Button>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
