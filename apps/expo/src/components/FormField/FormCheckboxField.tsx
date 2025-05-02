import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
} from "@/components/FormControl";
import Checkbox, { CheckboxProps } from "../Checkbox";
import { FormFieldProps } from "./types";

export const FormCheckboxField = ({
  isRequired,
  errors,
  isDisabled,
  children,
  ...props
}: Omit<FormFieldProps, "label"> & CheckboxProps) => {
  const hasErrors = errors.length > 0;

  return (
    <FormControl
      isInvalid={hasErrors}
      isRequired={isRequired}
      isDisabled={isDisabled}
    >
      <Checkbox {...props}>{children}</Checkbox>
      {hasErrors && (
        <FormControlError>
          <FormControlErrorIcon />
          <FormControlErrorText>{errors.join(", ")}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
};
