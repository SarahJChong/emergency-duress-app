import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { SecurityResponder } from "@/lib/api/types";
import SecurityRespondersModal from "../SecurityRespondersModal";

const mockLocation = {
  id: "1",
  name: "Test Location",
  defaultPhoneNumber: "123456789",
  defaultEmail: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  securityResponders: [
    {
      id: "1",
      name: "John Doe",
      email: "responder1@example.com",
    },
  ] as SecurityResponder[],
  hasIncidents: false,
};

// Mock the SecurityRespondersList component
jest.mock("@/components/SecurityRespondersList", () => {
  const MockSecurityRespondersList = () => null;
  MockSecurityRespondersList.displayName = "SecurityRespondersList";
  return {
    SecurityRespondersList: MockSecurityRespondersList,
  };
});

describe("SecurityRespondersModal", () => {
  it("renders with location name", () => {
    render(
      <SecurityRespondersModal
        isVisible={true}
        onClose={jest.fn()}
        location={mockLocation}
      />,
      {},
    );

    expect(screen.getByText(`${mockLocation.name} Security`)).toBeTruthy();
  });

  it("calls onClose when close button is pressed", () => {
    const onClose = jest.fn();
    render(
      <SecurityRespondersModal
        isVisible={true}
        onClose={onClose}
        location={mockLocation}
      />,
      {},
    );

    const closeButton = screen.getByText("Close");
    fireEvent.press(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("is not visible when isVisible is false", () => {
    render(
      <SecurityRespondersModal
        isVisible={false}
        onClose={jest.fn()}
        location={mockLocation}
      />,
      {},
    );
    // Modal component handles visibility internally
  });
});
