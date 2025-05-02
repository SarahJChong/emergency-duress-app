import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FormCheckboxField } from "../FormField/FormCheckboxField";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("FormCheckboxField", () => {
  const defaultProps = {
    value: false,
    onValueChange: jest.fn(),
    errors: [],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(
      <FormCheckboxField {...defaultProps}>Test Checkbox</FormCheckboxField>,
    );
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  it("displays error messages", () => {
    const errors = ["This field is required"];
    render(<FormCheckboxField {...defaultProps} errors={errors} />);
    expect(screen.getByText(errors.join(", "))).toBeTruthy();
  });

  it("toggles checkbox state on press", () => {
    const onValueChange = jest.fn();
    render(
      <FormCheckboxField {...defaultProps} onValueChange={onValueChange} />,
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("applies disabled state correctly", () => {
    render(<FormCheckboxField {...defaultProps} disabled />);
    expect(screen.getByRole("checkbox").props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it("applies different colors and sizes", () => {
    render(<FormCheckboxField {...defaultProps} color="secondary" size="lg" />);
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });

  it("matches snapshot", () => {
    render(<FormCheckboxField {...defaultProps} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
