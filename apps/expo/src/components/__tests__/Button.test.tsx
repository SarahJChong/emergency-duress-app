import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import Button from "../Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button testID="test-btn">Default Button</Button>);

    expect(screen.getByText("Default Button")).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies secondary color variant", () => {
    render(<Button color="secondary">Secondary</Button>);
    expect(screen.getByText("Secondary")).toBeTruthy();
    expect(screen.toJSON()).toMatchSnapshot();
  });

  // Size variant tests
  it("applies extra small size variant", () => {
    render(<Button size="xs">Extra Small</Button>);
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("h-8 px-3.5");
    expect(screen.getByText("Extra Small").props.className).toContain(
      "text-xs",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies small size variant", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("h-9 px-4");
    expect(screen.getByText("Small Button").props.className).toContain(
      "text-sm",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies medium size variant", () => {
    render(<Button size="md">Medium Button</Button>);
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("h-10 px-5");
    expect(screen.getByText("Medium Button").props.className).toContain(
      "text-base",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies large size variant", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("h-11 px-6");
    expect(screen.getByText("Large Button").props.className).toContain(
      "text-lg",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("disables the button", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button");
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Disabled Button")).toBeTruthy();
  });

  it("does not trigger onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <Button disabled onPress={onPress}>
        Disabled Button
      </Button>,
    );

    fireEvent.press(screen.getByText("Disabled Button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("handles press events", () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Press Me</Button>);

    fireEvent.press(screen.getByText("Press Me"));
    expect(onPress).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Styled Button</Button>);

    const button = screen.getByRole("button");
    expect(button.props.className).toContain("custom-class");
  });

  it("matches snapshot for different states", () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  // Outline variant tests
  it("renders outline variant with primary color", () => {
    render(
      <Button variant="outline" color="primary">
        Outline Primary
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("bg-transparent");
    expect(button.props.className).toContain("border");
    expect(button.props.className).toContain("border-primary");
    expect(screen.getByText("Outline Primary").props.className).toContain(
      "text-primary",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("renders outline variant with secondary color", () => {
    render(
      <Button variant="outline" color="secondary">
        Outline Secondary
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("bg-transparent");
    expect(button.props.className).toContain("border");
    expect(button.props.className).toContain("border-secondary");
    expect(screen.getByText("Outline Secondary").props.className).toContain(
      "text-secondary",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("renders outline variant with destructive color", () => {
    render(
      <Button variant="outline" color="destructive">
        Outline Destructive
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("bg-transparent");
    expect(button.props.className).toContain("border");
    expect(button.props.className).toContain("border-red-600");
    expect(screen.getByText("Outline Destructive").props.className).toContain(
      "text-red-600",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies outline variant with custom styles", () => {
    render(
      <Button
        variant="outline"
        color="primary"
        className="custom-class"
        textClassName="custom-text"
      >
        Custom Outline
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.props.className).toContain("custom-class");
    expect(screen.getByText("Custom Outline").props.className).toContain(
      "custom-text",
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
