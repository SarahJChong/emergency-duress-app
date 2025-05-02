import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FormInputField } from "../FormField/FormInputField";

// Mock the Ionicons import used by FormControlErrorIcon
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("FormInputField", () => {
  it("renders with required label", () => {
    render(
      <FormInputField
        label="Test Input"
        isRequired
        errors={[]}
        placeholder="Enter text"
      />,
    );

    const input = screen.getByLabelText("Test Input");
    expect(input).toBeTruthy();
    expect(input.props["aria-required"]).toBe(true);
  });

  it("displays error messages", () => {
    const errors = ["Required field", "Invalid format"];
    render(<FormInputField label="Test Input" errors={errors} />);

    // Find the combined error message
    expect(screen.getByText("Required field, Invalid format")).toBeTruthy();
  });

  it("does not set aria-invalid when there are no errors", () => {
    render(<FormInputField label="Test Input" errors={[]} />);

    const input = screen.getByLabelText("Test Input");
    expect(input.props["aria-invalid"]).toBeFalsy();
  });

  it("sets aria-invalid when there are errors", () => {
    render(<FormInputField label="Test Input" errors={["Error!"]} />);

    const input = screen.getByLabelText("Test Input");
    expect(input.props["aria-invalid"]).toBe(true);
  });

  it("handles text input changes", () => {
    const onChangeText = jest.fn();
    render(
      <FormInputField
        label="Test Input"
        errors={[]}
        onChangeText={onChangeText}
        placeholder="Enter text"
      />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    fireEvent.changeText(input, "test value");
    expect(onChangeText).toHaveBeenCalledWith("test value");
  });

  it("applies disabled state", () => {
    render(<FormInputField label="Test Input" errors={[]} editable={false} />);

    const input = screen.getByLabelText("Test Input");
    expect(input.props.editable).toBe(false);
  });

  it("matches snapshot", () => {
    render(<FormInputField label="Test Input" errors={[]} />);
    expect(screen.toJSON).toMatchSnapshot();
  });

  it("matches snapshot with error state", () => {
    render(
      <FormInputField
        label="Test Input"
        isRequired
        errors={["Required field"]}
        placeholder="Enter text"
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
