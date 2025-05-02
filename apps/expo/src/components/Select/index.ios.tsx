import React from "react";
import { ActionSheetIOS, Pressable, Text } from "react-native";

import { SelectProps } from "./types";

/**
 * iOS-specific Select:
 * Uses ActionSheetIOS to display a native action sheet when pressed.
 */
function Select({ options, value, onChange, onFocus, ...props }: SelectProps) {
  const selectedOption = options.find((o) => o.value === value);
  const label = selectedOption ? selectedOption.label : "Select...";

  const handlePress = () => {
    const optionLabels = options.map((o) => o.label);
    // Add "Cancel" at the end
    optionLabels.push("Cancel");
    const cancelButtonIndex = optionLabels.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: optionLabels,
        cancelButtonIndex,
      },
      (index) => {
        if (index === cancelButtonIndex) return;
        onChange(options[index].value);
      },
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      onFocus={onFocus}
      className="rounded border bg-white px-4 py-2"
      aria-labelledby={props["aria-labelledby"]}
      accessibilityLabel={props.accessibilityLabel}
      id={props.id}
      testID={props.testID}
    >
      <Text className="text-black">{label}</Text>
    </Pressable>
  );
}

export default Select;
