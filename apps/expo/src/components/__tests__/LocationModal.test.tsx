import React from "react";
import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { ApiLocation } from "@/lib/api";
import LocationModal from "../LocationModal/index";

// Mock the useForm hook
jest.mock("@tanstack/react-form", () => ({
  useForm: jest.fn(() => ({
    Field: ({ children }: any) =>
      children({
        state: {
          value: "",
          meta: { errors: [] },
        },
        handleChange: jest.fn(),
      }),
    handleSubmit: jest.fn(),
    Subscribe: ({ children }: any) => children([true, false]), // [canSubmit, isSubmitting]
    reset: jest.fn(),
    update: jest.fn(),
  })),
}));

describe("LocationModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    isVisible: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  it("renders correctly for creating a new location", () => {
    render(<LocationModal {...defaultProps} />);

    expect(screen.getByText("Add New Location")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter location name")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter default phone number"),
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter default email")).toBeTruthy();
  });

  it("renders correctly for editing an existing location", () => {
    const location: ApiLocation = {
      id: "1",
      name: "Test Location",
      defaultPhoneNumber: "123456789",
      defaultEmail: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      hasIncidents: false,
      securityResponders: [],
    };

    render(<LocationModal {...defaultProps} location={location} />);

    expect(screen.getByText("Edit Location")).toBeTruthy();
  });

  it("handles close button press", () => {
    render(<LocationModal {...defaultProps} />);

    fireEvent.press(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("disables name field when isNameDisabled is true", () => {
    const location: ApiLocation = {
      id: "1",
      name: "Test Location",
      defaultPhoneNumber: "123456789",
      defaultEmail: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      hasIncidents: true,
      securityResponders: [],
    };

    render(
      <LocationModal
        {...defaultProps}
        location={location}
        isNameDisabled={true}
      />,
    );

    const nameField = screen.getByPlaceholderText("Enter location name");
    expect(nameField.props["aria-disabled"]).toBe(true);
  });

  it("updates form state correctly", () => {
    const mockReset = jest.fn();
    const mockUpdate = jest.fn();
    (useForm as jest.Mock).mockImplementationOnce(() => ({
      Field: ({ children }: any) =>
        children({
          state: {
            value: "Test Value",
            meta: { errors: [] },
          },
          handleChange: jest.fn(),
        }),
      update: mockUpdate,
      reset: mockReset,
      Subscribe: ({ children }: any) => children([true, false]),
    }));

    render(<LocationModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("Enter location name");
    fireEvent.changeText(input, "New Value");

    expect(input.props.value).toBe("Test Value");
  });

  it("submits form data correctly", () => {
    const mockHandleSubmit = jest.fn();
    const mockReset = jest.fn();
    (useForm as jest.Mock).mockImplementationOnce(() => ({
      Field: ({ children }: any) =>
        children({
          state: {
            value: "Test Value",
            meta: { errors: [] },
          },
          handleChange: jest.fn(),
        }),
      handleSubmit: mockHandleSubmit,
      reset: mockReset,
      Subscribe: ({ children }: any) => children([true, false]),
    }));

    render(<LocationModal {...defaultProps} />);

    const submitButton = screen.getByText("Add Location");
    fireEvent.press(submitButton);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });
});
