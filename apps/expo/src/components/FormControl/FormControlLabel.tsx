import { cn } from "@/utils/cn";
import React, { LabelHTMLAttributes, ReactNode } from "react";
import { Platform, Text, TextProps } from "react-native";
import { useFormControlContext } from "./FormControl";

type WebProps = LabelHTMLAttributes<HTMLLabelElement>;
type NativeProps = TextProps;

type FormControlLabelProps = typeof Platform.OS extends "web"
  ? WebProps
  : NativeProps;

export const FormControlLabel = ({
  children,
  className,
  ...props
}: FormControlLabelProps) => {
  const { isRequired } = useFormControlContext();

  if (Platform.OS === "web") {
    return (
      <label
        className={cn("text-base text-neutral-800 font-semibold", className)}
        {...(props as WebProps)}
      >
        {children}
        {isRequired && <Text className="ml-0.5">*</Text>}
      </label>
    );
  } else {
    return (
      <Text
        className={cn("text-base text-neutral-800 font-semibold", className)}
        {...(props as NativeProps)}
      >
        {children}
        {isRequired && <Text className="ml-0.5">*</Text>}
      </Text>
    );
  }
};
