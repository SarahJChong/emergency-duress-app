import { useRouter } from "expo-router";
import { fireEvent, render, screen } from "@testing-library/react-native";

import CustomHeader from "@/components/CustomHeader";
import { AuthProvider } from "@/hooks/useAuth";

// Mock dependencies
jest.mock("expo-router");
jest.mock("expo-linking");
jest.mock("@/hooks/useAuth", () => ({
  ...jest.requireActual("@/hooks/useAuth"),
  useAuth: () => ({
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "",
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "header.resources": "Resources",
        "header.menu.aria_label": "Open menu",
        "common.back": "Back",
      })[key] || key,
  }),
}));

// Mock env
jest.mock("@/env", () => ({
  env: {
    EXPO_PUBLIC_RESOURCES_URL: "https://example.com/resources",
  },
}));

describe("CustomHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates back when no href provided", () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });

    const title = "Test";
    render(
      <AuthProvider clientId="test-id" endpoint="https://test.com">
        <CustomHeader title={title} />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByText(title));

    expect(mockBack).toHaveBeenCalled();
  });

  it("dismisses to href when provided", () => {
    const mockDismissTo = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ dismissTo: mockDismissTo });

    const href = "/" as const;
    const title = "Test";
    render(
      <AuthProvider clientId="test-id" endpoint="https://test.com">
        <CustomHeader title={title} href={href} />
      </AuthProvider>,
    );
    fireEvent.press(screen.getByText(title));

    expect(mockDismissTo).toHaveBeenCalledWith(href);
  });
});
