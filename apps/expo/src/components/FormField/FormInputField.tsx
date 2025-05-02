import { useId } from "react";
import { Platform, TextInputProps } from "react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
} from "@/components/FormControl";
import Input from "@/components/Input";
import { FormFieldProps } from "./types";

export const FormInputField = ({
  label,
  isRequired,
  isDisabled,
  errors,
  ...props
}: FormFieldProps & TextInputProps) => {
  const hasErrors = errors.length > 0;

  const labelId = useId();
  const inputId = useId();
  return (
    <FormControl
      isInvalid={hasErrors}
      isRequired={isRequired}
      isDisabled={isDisabled}
    >
      <FormControlLabel
        id={labelId}
        {...Platform.select({
          web: {
            htmlFor: inputId,
          },
        })}
      >
        {label}
      </FormControlLabel>
      <Input
        {...props}
        aria-labelledby={labelId}
        accessibilityLabel={label}
        id={inputId}
      />
      {hasErrors && (
        <FormControlError>
          <FormControlErrorIcon />
          <FormControlErrorText>{errors.join(", ")}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
};
