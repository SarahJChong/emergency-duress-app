import { Platform } from "react-native";
import Constants from "expo-constants";

import { env } from "../env";

export const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:5052";
    }
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];
    if (!localhost)
      throw new Error("failed to get localhost, configure it manually");
    return `http://${localhost}:5052`;
  }
  return env.EXPO_PUBLIC_API_URL;
};
