import { Platform } from "react-native";
import Constants from "expo-constants";

export const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:5052";
    }
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(":")[0];
    if (localhost) return `http://${localhost}:5052`;
  }
  return "https://app-duress-dev-ae.azurewebsites.net";
};
