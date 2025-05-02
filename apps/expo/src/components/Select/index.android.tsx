import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { SelectProps } from "./types";

/**
 * Android-specific Select:
 * Opens a Modal with a list of options when pressed.
 */
function Select({ options, value, onChange, onFocus }: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const label = selectedOption ? selectedOption.label : "Select...";

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleOptionPress = (optionValue: string) => {
    onChange(optionValue);
    closeModal();
  };

  return (
    <>
      <Pressable
        className="rounded border bg-white px-4 py-2"
        onPress={openModal}
        onFocus={onFocus}
      >
        <Text className="text-black">{label}</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent onRequestClose={closeModal}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-3/4 rounded bg-white">
            {options.map((opt) => (
              <Pressable
                key={String(opt.value)}
                className="border-b border-gray-200 p-4"
                onPress={() => handleOptionPress(opt.value)}
              >
                <Text>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={closeModal} className="bg-gray-100 p-4">
              <Text className="text-center font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default Select;
