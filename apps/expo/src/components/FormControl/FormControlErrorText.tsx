import { cn } from "@/utils/cn";
import React, { ReactNode } from "react";
import { Text } from "react-native";

interface FormControlErrorProps {
  className?: string;
  children: ReactNode;
}

export const FormControlErrorText = ({
  children,
  className,
}: FormControlErrorProps) => {
  return (
    <Text className={cn("text-red-500 text-sm", className)}>{children}</Text>
  );
};
