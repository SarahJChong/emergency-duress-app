import React from "react";
import { render, screen } from "@testing-library/react-native";

import Select from "../Select/index.web";
import type { SelectProps } from "../Select/types";

jest.mock("@expo/vector-icons", () => ({
  Entypo: "",
}));

describe("Select (Web)", () => {
  const defaultProps: SelectProps = {
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
    value: null,
    onChange: jest.fn(),
  };

  // TODO add more tests

  it("matches snapshot", () => {
    render(<Select {...defaultProps} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
