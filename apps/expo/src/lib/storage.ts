import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function setStorageItemAsync<T>(key: string, value: T) {
  const stringValue = value != null ? JSON.stringify(value) : null;

  if (Platform.OS === "web") {
    try {
      if (stringValue === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, stringValue);
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    if (stringValue == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, stringValue);
    }
  }
}

export async function getStorageItemAsync(key: string): Promise<unknown> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    try {
      const raw = await SecureStore.getItemAsync(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("SecureStore data parsing error:", e);
      return null;
    }
  }

  return null;
}
