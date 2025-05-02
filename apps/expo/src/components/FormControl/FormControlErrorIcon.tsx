import React from "react";
import { Ionicons } from "@expo/vector-icons";
import colors from "tailwindcss/colors";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface FormControlErrorProps {
  className?: string;

  /**
   * The name of the Ionicons icon.
   * @default "alert-circle-outline"
   */
  name?: IoniconsName;

  /**
   * The size of the icon.
   * @default 24
   */
  size?: number;

  /**
   * The color of the icon.
   * @default colors.red[500]
   */
  color?: string;
}

export const FormControlErrorIcon = ({
  className,
  name = "alert-circle-outline",
  size = 24,
  color = colors.red[500],
}: FormControlErrorProps) => {
  return (
    <Ionicons name={name} size={size} color={color} className={className} />
  );
};
