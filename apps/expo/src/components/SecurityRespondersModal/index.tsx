import React from "react";
import { Modal, Text, View } from "react-native";

import Button from "@/components/Button";
import { SecurityRespondersList } from "@/components/SecurityRespondersList";
import type { ApiLocation } from "@/lib/api";

interface SecurityRespondersModalProps {
  isVisible: boolean;
  onClose: () => void;
  location: ApiLocation;
}

/**
 * Modal component for managing security responders
 */
export default function SecurityRespondersModal({
  isVisible,
  onClose,
  location,
}: SecurityRespondersModalProps) {
  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View className="flex-1 justify-center bg-black/50 p-4">
        <View className="rounded-lg bg-white p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-medium">
              {location.name} Security
            </Text>
          </View>

          {/* Security Responders List Component */}
          <View className="max-h-96">
            <SecurityRespondersList location={location} />
          </View>

          <View className="mt-4 flex-row justify-end">
            <Button onPress={onClose} variant="outline">
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
