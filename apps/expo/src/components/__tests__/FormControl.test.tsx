import React from "react";
import { Text, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  useFormControlContext,
} from "../FormControl";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

describe("FormControl", () => {
  it("renders children correctly", () => {
    render(
      <FormControl>
        <View testID="test-child" />
      </FormControl>,
    );
    expect(screen.getByTestId("test-child")).toBeTruthy();
  });

  it("applies custom className", () => {
    render(
      <FormControl className="custom-class">
        <View />
      </FormControl>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("provides context values to children", () => {
    const TestChild = () => {
      const context = useFormControlContext();
      return (
        <View testID="test-child">
          {context.isInvalid && <Text>Invalid</Text>}
          {context.isDisabled && <Text>Disabled</Text>}
          {context.isRequired && <Text>Required</Text>}
        </View>
      );
    };

    render(
      <FormControl isInvalid isDisabled isRequired>
        <TestChild />
      </FormControl>,
    );

    expect(screen.getByText("Invalid")).toBeTruthy();
    expect(screen.getByText("Disabled")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("matches snapshot", () => {
    render(
      <FormControl>
        <View></View>
      </FormControl>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe("FormControlError", () => {
  it("renders error message when form is invalid", () => {
    render(
      <FormControl isInvalid>
        <FormControlError>
          <Text>Error message</Text>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.getByText("Error message")).toBeTruthy();
  });

  it("does not render when form is valid", () => {
    render(
      <FormControl>
        <FormControlError>
          <Text>Error message</Text>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.queryByText("Error message")).toBeNull();
  });

  it("does not render when form is disabled", () => {
    render(
      <FormControl isInvalid isDisabled>
        <FormControlError>
          <Text>Error message</Text>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.queryByText("Error message")).toBeNull();
  });

  it("matches snapshot", () => {
    render(
      <FormControl isInvalid>
        <FormControlError>
          <Text>Error message</Text>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe("FormControlErrorIcon", () => {
  it("renders with default props", () => {
    render(<FormControlErrorIcon />);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("renders with custom props", () => {
    render(
      <FormControlErrorIcon
        name="warning-outline"
        size={32}
        color="#ff0000"
        className="custom-class"
      />,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe("FormControlErrorText", () => {
  it("renders error text with default styles", () => {
    render(<FormControlErrorText>Error message</FormControlErrorText>);
    expect(screen.getByText("Error message")).toBeTruthy();
  });

  it("applies custom className", () => {
    render(
      <FormControlErrorText className="custom-class">
        Error message
      </FormControlErrorText>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe("FormControlLabel", () => {
  it("renders label text", () => {
    render(
      <FormControl>
        <FormControlLabel>Label Text</FormControlLabel>
      </FormControl>,
    );
    expect(screen.getByText("Label Text")).toBeTruthy();
  });

  it("shows required indicator when isRequired is true", () => {
    render(
      <FormControl isRequired>
        <FormControlLabel>Label Text</FormControlLabel>
      </FormControl>,
    );
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("renders correctly", () => {
    render(<FormControlLabel>Web Label</FormControlLabel>);
    expect(screen.toJSON()).toMatchSnapshot();
  });

  it("applies custom className", () => {
    render(
      <FormControlLabel className="custom-class">Label Text</FormControlLabel>,
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe("FormControl Integration Tests", () => {
  it("renders complete error state with icon and message", () => {
    render(
      <FormControl isInvalid>
        <FormControlError>
          <FormControlErrorIcon />
          <FormControlErrorText>Invalid input</FormControlErrorText>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.getByText("Invalid input")).toBeTruthy();
  });

  it("does not render when form is valid", () => {
    render(
      <FormControl>
        <FormControlError>
          <FormControlErrorText>Error Content</FormControlErrorText>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.queryByText("Error Content")).toBeNull();
  });

  it("does not render when form is disabled", () => {
    render(
      <FormControl isInvalid isDisabled>
        <FormControlError>
          <FormControlErrorText>Error Content</FormControlErrorText>
        </FormControlError>
      </FormControl>,
    );
    expect(screen.queryByText("Error Content")).toBeNull();
  });
});
