import React from "react";
import { render, screen } from "@testing-library/react-native";

import LoadingScreen from "../Loading";

describe("LoadingScreen", () => {
  it("renders loading screen with all components", () => {
    render(<LoadingScreen />);

    // Check loading text
    expect(screen.getByText("Loading...")).toBeTruthy();

    // Check brand icon
    expect(screen.getByLabelText("brand icon")).toBeTruthy();

    // Check loading spinner
    expect(screen.getByLabelText("Loading spinner")).toBeTruthy();
  });

  it("configures brand icon correctly", () => {
    render(<LoadingScreen />);
    const brandIcon = screen.getByLabelText("brand icon");

    expect(brandIcon.props.source).toBeDefined();
    expect(brandIcon.props.contentFit).toBe("cover");
  });

  it("configures activity indicator correctly", () => {
    render(<LoadingScreen />);
    const spinner = screen.getByLabelText("Loading spinner");

    expect(spinner.props.size).toBe("large");
  });

  it("matches snapshot", () => {
    render(<LoadingScreen />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
