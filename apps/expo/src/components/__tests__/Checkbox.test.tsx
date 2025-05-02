import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import Checkbox from "../Checkbox";

describe("Checkbox", () => {
  it("renders with default props", () => {
    render(<Checkbox>Default Checkbox</Checkbox>);
    expect(screen.getByText("Default Checkbox")).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("renders with a secondary color variant", () => {
    render(<Checkbox color="secondary">Secondary</Checkbox>);
    expect(screen.getByText("Secondary")).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("renders with a large size variant", () => {
    render(<Checkbox size="lg">Large Checkbox</Checkbox>);
    expect(screen.getByText("Large Checkbox")).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("disables the checkbox", () => {
    render(<Checkbox disabled>Disabled Checkbox</Checkbox>);
    expect(screen.getByRole("checkbox").props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it("handles value change correctly", () => {
    const onValueChange = jest.fn();
    render(<Checkbox onValueChange={onValueChange}>Toggle Me</Checkbox>);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("matches snapshot for different states", () => {
    render(<Checkbox disabled>Disabled Checkbox</Checkbox>);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
