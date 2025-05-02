import { useCallback, useEffect, useReducer } from "react";

import { getStorageItemAsync, setStorageItemAsync } from "@/lib/storage";

/**
 * Type definition for the useStorageState hook return value
 * First element is a tuple containing loading state and value
 * Second element is a function to update the stored value
 */
type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

/**
 * Internal hook for managing async state with loading indicator
 *
 * @template T - The type of value being stored
 * @param initialValue - Initial state tuple with loading flag and value
 * @returns State tuple and setter function
 */
function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
  return useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null,
    ): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStateHook<T>;
}

/**
 * Hook for persisting and retrieving state from device storage
 *
 * Provides a React state-like interface for values that need to persist
 * across app restarts. Handles loading from storage on mount and
 * saving to storage when the value changes.
 *
 * @template T - The type of value being stored
 * @param key - The storage key to use for this value
 * @returns A tuple containing:
 *   - [isLoading, value]: Current loading state and value
 *   - setValue: Function to update the stored value
 *
 * @example
 * ```tsx
 * // Store user preferences
 * const [[isLoading, preferences], setPreferences] = useStorageState<UserPreferences>("userPrefs");
 *
 * // Update a preference
 * const updateTheme = (theme: string) => {
 *   setPreferences({...preferences, theme});
 * };
 *
 * // Clear preferences
 * const resetPreferences = () => {
 *   setPreferences(null);
 * };
 * ```
 */
export function useStorageState<T>(key: string): UseStateHook<T> {
  const [state, setState] = useAsyncState<T>();

  useEffect(() => {
    const load = async () => {
      try {
        const item = (await getStorageItemAsync(key)) as T | null;
        setState(item);
      } catch (error) {
        console.error("Error loading from storage:", error);
        setState(null);
      }
    };

    load();
  }, [key]);

  const setValue = useCallback(
    async (value: T | null) => {
      try {
        await setStorageItemAsync(key, value);
        setState(value);
      } catch (error) {
        console.error("Error saving to storage:", error);
        setState(null);
      }
    },
    [key],
  );

  return [state, setValue];
}
