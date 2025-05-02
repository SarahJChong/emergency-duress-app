import React from "react";
import { Platform, TextInput, TextInputProps } from "react-native";
import { tv } from "tailwind-variants";

import { useFormControlContext } from "../FormControl/FormControl";

const input = tv({
  base: "block w-full rounded-md bg-white px-3 py-2.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-accent sm:text-sm/6",
  variants: {
    disabled: {
      true: "cursor-not-allowed border-gray-200 text-gray-300 placeholder:text-gray-400",
    },
    invalid: {
      true: "border-red-500",
    },
  },
});

const Input = ({ className, ...props }: TextInputProps) => {
  const { isDisabled, isInvalid, isRequired } = useFormControlContext();
  return (
    <TextInput
      editable={!isDisabled || props.editable}
      selectTextOnFocus={!isDisabled || props.selectTextOnFocus}
      readOnly={isDisabled || props.readOnly}
      {...Platform.select({
        web: {
          disabled: isDisabled,
        },
      })}
      aria-disabled={isDisabled || props["aria-disabled"]}
      aria-invalid={isInvalid}
      aria-required={isRequired}
      className={input({
        disabled: isDisabled,
        invalid: isInvalid && !isDisabled,
        className,
      })}
      {...props}
    />
  );
};

export default Input;
