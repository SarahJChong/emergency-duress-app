import { cn } from "@/utils/cn";
import React, { createContext, useContext, ReactNode } from "react";
import { View } from "react-native";

interface FormControlContextValue {
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  //  can add more states like isDisabled, isRequired, etc as needed
}

// Create the context with a default value
const FormControlContext = createContext<FormControlContextValue>({});

// Hook for child components to consume the context value
export const useFormControlContext = () => {
  return useContext(FormControlContext);
};

type FormControlProps = {
  className?: string;
  children: ReactNode;
} & FormControlContextValue;

export const FormControl = ({
  children,
  isInvalid,
  isDisabled,
  isRequired,
  className,
}: FormControlProps) => {
  // Provide state to child components
  return (
    <FormControlContext.Provider value={{ isInvalid, isDisabled, isRequired }}>
      <View className={cn("my-2", className)}>{children}</View>
    </FormControlContext.Provider>
  );
};
