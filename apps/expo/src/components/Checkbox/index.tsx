import React, { useId } from "react";
import { Platform, Text, TextProps, View } from "react-native";
import {
  Checkbox as RNCheckbox,
  CheckboxProps as RNCheckboxProps,
} from "expo-checkbox";
import { tv, VariantProps } from "tailwind-variants";

const checkboxStyle = tv({
  slots: {
    checkbox: "mr-2",
    text: null,
  },
  variants: {
    color: {
      primary: {
        checkbox: "accent-primary",
        text: null,
      },
      secondary: {
        pressable: "accent-secondary",
        text: null,
      },
    },
    size: {
      md: {
        checkbox: "px-2.5 py-2.5",
        text: "text-sm",
      },
      lg: {
        checkbox: "px-4 py-4",
        text: "text-md",
      },
    },
    disabled: {
      true: {
        checkbox: "accent-gray-500",
        text: "text-gray-400",
      },
    },
  },
  defaultVariants: {
    color: "primary",
    size: "md",
  },
});

export interface CheckboxProps
  extends Omit<RNCheckboxProps, "disabled" | "children" | "color">,
    Pick<TextProps, "children">,
    VariantProps<typeof checkboxStyle> {
  containerClass?: string;
}

const Checkbox = ({
  disabled,
  color,
  size,
  children,
  containerClass,
  ...props
}: CheckboxProps) => {
  const autoId = useId();
  const { checkbox, text } = checkboxStyle({ disabled, color, size });
  return (
    <View className={`flex-row ${containerClass}`}>
      <RNCheckbox
        className={checkbox()}
        disabled={disabled}
        aria-disabled={disabled}
        color={color === "secondary" ? "#04c8c7" : "#003951"}
        id={autoId}
        role="checkbox"
        aria-checked={props.value}
        {...props}
      />
      {Platform.OS === "web" ? (
        <label className={text()} htmlFor={autoId}>
          {children}
        </label>
      ) : (
        <Text className={text()}>{children}</Text>
      )}
    </View>
  );
};

export default Checkbox;
