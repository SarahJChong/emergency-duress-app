import { useId } from "react";
import { Platform } from "react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
} from "@/components/FormControl";
import Select from "@/components/Select";
import { SelectProps } from "@/components/Select/types";
import { FormFieldProps } from "./types";

export const FormSelectField = ({
  label,
  isRequired,
  isDisabled,
  errors,
  ...props
}: FormFieldProps & SelectProps) => {
  const hasErrors = errors.length > 0;

  const labelId = useId();
  const selectId = useId();
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
            htmlFor: selectId,
          },
        })}
      >
        {label}
      </FormControlLabel>
      <Select
        {...props}
        aria-labelledby={labelId}
        accessibilityLabel={label}
        id={selectId}
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
