import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import Select from "../Select/index.android";
import type { SelectProps } from "../Select/types";

describe("Select (Android)", () => {
  const defaultProps: SelectProps = {
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
    value: null,
    onChange: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders Pressable component", () => {
    render(<Select {...defaultProps} />);
    expect(screen.getByText("Select...")).toBeTruthy();
  });

  it("shows selected option label", () => {
    render(<Select {...defaultProps} value="2" />);
    expect(screen.getByText("Option 2")).toBeTruthy();
  });

  it("handles press to open modal", () => {
    render(<Select {...defaultProps} />);
    fireEvent.press(screen.getByText("Select..."));
    expect(screen.getByText("Option 1")).toBeTruthy();
  });

  it("handles selection change", () => {
    const onChange = jest.fn();
    render(<Select {...defaultProps} onChange={onChange} />);

    fireEvent.press(screen.getByText("Select..."));
    fireEvent.press(screen.getByText("Option 2"));

    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("matches snapshot", () => {
    render(<Select {...defaultProps} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
