import Constants from "expo-constants";

import { getBaseUrl } from "../baseUrl";

jest.mock("expo-constants", () => ({
  expoConfig: {
    hostUri: undefined,
  },
}));

describe("getBaseUrl", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return localhost URL when hostUri is available", () => {
    // Mock Constants.expoConfig.hostUri
    (Constants.expoConfig as any).hostUri = "192.168.1.100:19000";

    const result = getBaseUrl();

    expect(result).toBe("http://192.168.1.100:5052");
  });

  it("should return default URL when hostUri is not available", () => {
    // Mock Constants.expoConfig.hostUri as undefined
    (Constants.expoConfig as any).hostUri = undefined;

    const result = getBaseUrl();

    expect(result).toBe("https://app-duress-dev-ae.azurewebsites.net");
  });
});
