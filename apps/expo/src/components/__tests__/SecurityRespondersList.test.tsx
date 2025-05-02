import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { useLocations } from "@/hooks/useLocations";
import type { SecurityResponder } from "@/lib/api/types";
import { SecurityRespondersList } from "../SecurityRespondersList";

// Mock the useLocations hook
jest.mock("@/hooks/useLocations", () => ({
  useLocations: jest.fn(),
}));

const mockSecurityResponders: SecurityResponder[] = [
  {
    id: "1",
    name: "John Doe",
    email: "responder1@example.com",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
  },
];

const mockLocation = {
  id: "1",
  name: "Test Location",
  defaultPhoneNumber: "123456789",
  defaultEmail: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  securityResponders: [mockSecurityResponders[0]], // John is already assigned
  hasIncidents: false,
};

const defaultMockHook = {
  addSecurityResponder: jest.fn(),
  removeSecurityResponder: jest.fn(),
  isAddingResponder: false,
  isRemovingResponder: false,
  securityResponders: mockSecurityResponders,
  isLoadingResponders: false,
};

describe("SecurityRespondersList", () => {
  beforeEach(() => {
    (useLocations as jest.Mock).mockReturnValue(defaultMockHook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows currently assigned and available responders", () => {
    render(<SecurityRespondersList location={mockLocation} />, {});

    // Header text
    expect(screen.getByText("Manage Security Responders")).toBeTruthy();

    // John should be in assigned list
    const johnAssigned = screen.getByTestId("assigned-responder-1");
    expect(johnAssigned).toBeTruthy();
    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("responder1@example.com")).toBeTruthy();

    // Jane should be in available list
    const janeAvailable = screen.getByTestId("available-responder-2");
    expect(janeAvailable).toBeTruthy();
    expect(screen.getByText("Jane Smith (jane@example.com)")).toBeTruthy();
  });

  it("filters available responders based on search", () => {
    render(<SecurityRespondersList location={mockLocation} />, {});

    const searchInput = screen.getByTestId("security-responder-search");

    // Search by name
    fireEvent.changeText(searchInput, "Jane");
    expect(screen.getByTestId("available-responder-2")).toBeTruthy();
    expect(screen.getByText("Jane Smith (jane@example.com)")).toBeTruthy();

    // Search should not show already assigned responders
    expect(screen.queryByText("John Doe (responder1@example.com)")).toBeFalsy();
  });

  it("adds a security responder with optimistic update", async () => {
    const mockAddResponder = jest.fn();
    (useLocations as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      addSecurityResponder: mockAddResponder,
    });

    render(<SecurityRespondersList location={mockLocation} />, {});

    // Find and click Add button for Jane
    const addButton = screen.getByTestId("add-responder-2");
    fireEvent.press(addButton);

    // Jane should disappear from available list
    await waitFor(() => {
      expect(screen.queryByTestId("available-responder-2")).toBeFalsy();
    });

    // Jane should appear in assigned list
    await waitFor(() => {
      expect(screen.getByTestId("assigned-responder-2")).toBeTruthy();
    });

    // API call should be made
    expect(mockAddResponder).toHaveBeenCalledWith({
      locationId: "1",
      email: "jane@example.com",
    });
  });

  it("removes a security responder with optimistic update", async () => {
    const mockRemoveResponder = jest.fn();
    (useLocations as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      removeSecurityResponder: mockRemoveResponder,
    });

    render(<SecurityRespondersList location={mockLocation} />, {});

    // Remove John
    const removeButton = screen.getByTestId("remove-responder-1");
    fireEvent.press(removeButton);

    // John should disappear from assigned list
    await waitFor(() => {
      expect(screen.queryByTestId("assigned-responder-1")).toBeFalsy();
    });

    // John should appear in available list
    await waitFor(() => {
      expect(screen.getByTestId("available-responder-1")).toBeTruthy();
    });

    expect(mockRemoveResponder).toHaveBeenCalledWith({
      locationId: "1",
      email: "responder1@example.com",
    });
  });

  it("shows loading state", () => {
    (useLocations as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      isLoadingResponders: true,
    });

    render(<SecurityRespondersList location={mockLocation} />, {});
    expect(screen.getByText("Loading responders...")).toBeTruthy();
  });

  it("handles add errors and reverts optimistic update", async () => {
    const mockError = new Error("Failed to add responder");
    const mockAddResponder = jest.fn().mockRejectedValue(mockError);
    (useLocations as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      addSecurityResponder: mockAddResponder,
    });

    render(<SecurityRespondersList location={mockLocation} />, {});

    // Try to add Jane
    fireEvent.press(screen.getByTestId("add-responder-2"));

    // Error should be shown
    await waitFor(() => {
      expect(screen.getByText(mockError.message)).toBeTruthy();
    });

    // Jane should still be in available list and not in assigned
    await waitFor(() => {
      // Still in available list
      expect(screen.getByTestId("available-responder-2")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("assigned-responder-2")).toBeFalsy();
    });
  });

  it("handles remove errors and reverts optimistic update", async () => {
    const mockError = new Error("Failed to remove responder");
    const mockRemoveResponder = jest.fn().mockRejectedValue(mockError);
    (useLocations as jest.Mock).mockReturnValue({
      ...defaultMockHook,
      removeSecurityResponder: mockRemoveResponder,
    });

    render(<SecurityRespondersList location={mockLocation} />, {});

    // Try to remove John
    fireEvent.press(screen.getByTestId("remove-responder-1"));

    // Error should be shown
    await waitFor(() => {
      expect(screen.getByText(mockError.message)).toBeTruthy();
    });

    // John should still be in assigned list and not in available
    await waitFor(() => {
      expect(screen.getByTestId("assigned-responder-1")).toBeTruthy();
    });

    await waitFor(() => {
      // Not in available list
      expect(screen.queryByTestId("available-responder-1")).toBeFalsy();
    });
  });
});
