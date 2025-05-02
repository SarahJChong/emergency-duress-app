import React from "react";
import { render, screen } from "@testing-library/react-native";

import OfflineBanner from "../OfflineBanner";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("OfflineBanner", () => {
  it("should not render when isVisible is false", () => {
    render(<OfflineBanner isVisible={false} />);

    // The component should return null when not visible
    expect(
      screen.queryByText("You are offline. Some features may be limited."),
    ).toBeNull();
  });

  it("should render when isVisible is true", () => {
    render(<OfflineBanner isVisible={true} />);

    // The component should display the offline message
    expect(
      screen.getByText("You are offline. Some features may be limited."),
    ).toBeTruthy();
  });

  it("should have the correct styling", () => {
    render(<OfflineBanner isVisible={true} />);

    // Check that the text has the correct styling
    const textElement = screen.getByText(
      "You are offline. Some features may be limited.",
    );
    expect(textElement.props.className).toContain("text-back ml-2 text-center");

    // The parent View should have the yellow background
    const parentView = textElement.parent.parent;
    expect(parentView.props.className).toContain("bg-yellow-500");
  });

  it("matches snapshot", () => {
    render(<OfflineBanner isVisible />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
