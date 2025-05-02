import React from "react";
import { act, render, screen } from "@testing-library/react-native";

import { FormControl } from "../FormControl";
import Input from "../Input";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("Input - Additional Tests", () => {
  it("sets aria-required when isRequired is true", () => {
    render(
      <FormControl isRequired>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props["aria-required"]).toBe(true);
  });

  it("sets aria-disabled when form control is disabled", () => {
    render(
      <FormControl isDisabled>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props["aria-disabled"]).toBe(true);
  });

  it("sets aria-invalid when form control is invalid", () => {
    render(
      <FormControl isInvalid>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props["aria-invalid"]).toBe(true);
  });

  it("does not set aria-invalid when form control is valid", () => {
    render(
      <FormControl>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props["aria-invalid"]).toBeFalsy();
  });

  it("ensures className updates based on validity", () => {
    render(
      <FormControl isInvalid>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.className).toContain("border-red-500");
  });

  it("ensures className updates based on disabled state", () => {
    render(
      <FormControl isDisabled>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.className).toContain("border-gray-200");
  });

  it("handles focus and blur events correctly", () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    render(
      <Input placeholder="Enter text" onFocus={onFocus} onBlur={onBlur} />,
    );

    const input = screen.getByPlaceholderText("Enter text");

    // Call onFocus manually
    act(() => {
      input.props.onFocus();
    });
    expect(onFocus).toHaveBeenCalled();

    // Call onBlur manually
    act(() => {
      input.props.onBlur();
    });
    expect(onBlur).toHaveBeenCalled();
  });

  it("matches snapshot with different states", () => {
    const { toJSON } = render(
      <FormControl isInvalid isDisabled>
        <Input placeholder="Enter text" />
      </FormControl>,
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
