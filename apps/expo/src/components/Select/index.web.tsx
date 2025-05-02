import React from "react";
import { Entypo } from "@expo/vector-icons";

import { SelectProps } from "./types";

/**
 * A native <select> element for the web platform.
 */
function Select({ options, value, onChange, onFocus, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className="w-full appearance-none rounded-md bg-white py-2.5 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        value={value ?? ""}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={onFocus}
        aria-labelledby={props["aria-labelledby"]}
        role="combobox"
      >
        {/* Optional placeholder if no value is selected */}
        {value === null || value === "" ? (
          <option value="" disabled>
            Select...
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Entypo
        name="chevron-thin-down"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 transform text-gray-500 sm:size-4"
      />
    </div>
  );
}

export default Select;
