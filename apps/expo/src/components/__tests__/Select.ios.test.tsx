import React from "react";
import { render, screen } from "@testing-library/react-native";

import Select from "../Select/index.ios";
import type { SelectProps } from "../Select/types";

describe("Select (iOS)", () => {
  const defaultProps: SelectProps = {
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
    value: null,
    onChange: jest.fn(),
  };

  it("renders Pressable component", () => {
    render(<Select {...defaultProps} />);
    expect(screen.getByText("Select...")).toBeTruthy();
  });

  it("shows selected option label", () => {
    render(<Select {...defaultProps} value="2" />);
    expect(screen.getByText("Option 2")).toBeTruthy();
  });

  it("matches snapshot", () => {
    render(<Select {...defaultProps} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
