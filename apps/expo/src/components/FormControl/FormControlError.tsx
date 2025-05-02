import React, { ReactNode } from "react";
import { View } from "react-native";
import { useFormControlContext } from "./FormControl";
import { cn } from "@/utils/cn";

interface FormControlErrorProps {
  className?: string;
  children: ReactNode;
}

export const FormControlError = ({
  children,
  className,
}: FormControlErrorProps) => {
  // Read the current `invalid` state from context
  const { isInvalid, isDisabled } = useFormControlContext();

  // If not invalid, return null to skip rendering
  if (!isInvalid || isDisabled) return null;

  return (
    <View className={cn("flex flex-row items-center mt-2 gap-2", className)}>
      {children}
    </View>
  );
};
