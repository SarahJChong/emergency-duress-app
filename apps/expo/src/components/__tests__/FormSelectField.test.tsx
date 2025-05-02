import React from "react";
import { Platform } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FormSelectField } from "../FormField/FormSelectField";

// Mock the Ionicons import used by FormControlErrorIcon
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("FormSelectField", () => {
  const defaultProps = {
    label: "Test Select",
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
    value: null,
    onChange: jest.fn(),
    errors: [],
  };

  it("renders with required label", () => {
    render(<FormSelectField {...defaultProps} isRequired />);
    const input = screen.getByLabelText("Test Select");
    expect(input).toBeTruthy();
    expect(input.props.accessibilityLabel).toBe("Test Select");
  });

  it("displays error messages", () => {
    const errors = ["Required field", "Invalid selection"];
    render(<FormSelectField {...defaultProps} errors={errors} />);

    expect(screen.getByText("Required field, Invalid selection")).toBeTruthy();
  });

  it("handles selection changes", () => {
    const onChange = jest.fn();
    render(
      <FormSelectField
        {...defaultProps}
        onChange={onChange}
        testID="form-select"
      />,
    );

    const select = screen.getByTestId("form-select");
    fireEvent(select, "onChange", { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: "2" } });
  });

  it("handles web platform behavior", () => {
    Platform.OS = "web";
    render(<FormSelectField {...defaultProps} testID="form-select" />);

    const select = screen.getByTestId("form-select");
    expect(select).toBeTruthy();
  });

  it("handles native platform behavior", () => {
    Platform.OS = "ios";
    render(<FormSelectField {...defaultProps} testID="form-select" />);

    const select = screen.getByTestId("form-select");
    expect(select).toBeTruthy();
  });

  it("matches snapshot", () => {
    render(<FormSelectField {...defaultProps} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
