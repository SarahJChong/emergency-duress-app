import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";
import type { RegistrationDetails, UserResponse } from "./types";

/**
 * Fetches the current user's profile information
 * @returns The user profile data or null if not found
 * @throws Error if the request fails
 */
export const fetchMe = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status == 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch user.");
  }
  return (await response.json()) as UserResponse;
};

/**
 * Registers a new user with the provided details
 * @param details The registration details including contact number and location
 * @returns The registered user details
 * @throws Error if registration fails
 */
export const registerUser = async (details: RegistrationDetails) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(details),
  });
  if (!response.ok) {
    throw new Error("Failed to register.");
  }
};

/**
 * Updates the current user's profile information
 * @param details The updated user details
 * @returns The updated user profile
 * @throws Error if the update fails
 */
export const updateUser = async (details: RegistrationDetails) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(details),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile.");
  }
  return (await response.json()) as UserResponse;
};
