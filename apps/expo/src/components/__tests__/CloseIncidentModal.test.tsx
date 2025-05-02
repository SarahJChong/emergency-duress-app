import React from "react";
import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/useAuth";
import CloseIncidentModal from "../CloseIncidentModal";

// Mock dependencies
jest.mock("@tanstack/react-form", () => ({
  useForm: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "incidents.close.title": "Close Incident",
        "incidents.close.notes.placeholder": "Enter closure notes...",
        "common.cancel": "Cancel",
        "incidents.close.button.closing": "Closing...",
      })[key] || key,
  }),
}));

describe("CloseIncidentModal", () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();
  const mockUser = { name: "Test User" };
  const mockForm = {
    Field: ({ children }: any) =>
      children({
        state: { value: "", meta: { errors: [] } },
        handleChange: jest.fn(),
      }),
    Subscribe: ({ children }: any) => children([true, false]),
    handleSubmit: jest.fn(),
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useForm as jest.Mock).mockReturnValue(mockForm);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when visible", () => {
    render(
      <CloseIncidentModal
        isVisible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(
      screen.getByText(useTranslation().t("incidents.close.title")),
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText(
        useTranslation().t("incidents.close.notes.placeholder"),
      ),
    ).toBeTruthy();
    expect(screen.getByText(useTranslation().t("common.cancel"))).toBeTruthy();
  });

  it("does not render when not visible", () => {
    render(
      <CloseIncidentModal
        isVisible={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(
      screen.queryByText(useTranslation().t("incidents.close.title")),
    ).toBeNull();
  });

  it("calls onClose when cancel button is pressed", () => {
    render(
      <CloseIncidentModal
        isVisible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />,
    );

    const cancelButton = screen.getByText(useTranslation().t("common.cancel"));
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error message when provided", () => {
    const error = new Error("Test error");
    render(
      <CloseIncidentModal
        isVisible={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        error={error}
      />,
    );

    expect(screen.getByText("Test error")).toBeTruthy();
  });
});
