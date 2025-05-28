import { z } from "zod";

// Construct the env object manually to ensure static references
/*
 Every environment variable must be statically referenced as a property of process.env using JavaScript's dot notation for it to be inlined.
 For example, the expression process.env.EXPO_PUBLIC_KEY is valid and will be inlined.

 Alternative versions of the expression are NOT supported. 
 For example, process.env['EXPO_PUBLIC_KEY'] or const {EXPO_PUBLIC_X} = process.env is invalid and will not be inlined.

 https://docs.expo.dev/guides/environment-variables/#how-to-read-from-environment-variables
*/
const rawEnv = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_EMERGENCY_PHONE_NUMBER:
    process.env.EXPO_PUBLIC_EMERGENCY_PHONE_NUMBER,
  EXPO_PUBLIC_AUTH_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH_CLIENT_ID,
  EXPO_PUBLIC_AUTH_ENDPOINT: process.env.EXPO_PUBLIC_AUTH_ENDPOINT,
  EXPO_PUBLIC_COLOR_PRIMARY: process.env.EXPO_PUBLIC_COLOR_PRIMARY,
  EXPO_PUBLIC_COLOR_SECONDARY: process.env.EXPO_PUBLIC_COLOR_SECONDARY,
  EXPO_PUBLIC_COLOR_ACCENT: process.env.EXPO_PUBLIC_COLOR_ACCENT,
  EXPO_PUBLIC_COLOR_SUCCESS: process.env.EXPO_PUBLIC_COLOR_SUCCESS,
  EXPO_PUBLIC_COLOR_ERROR: process.env.EXPO_PUBLIC_COLOR_ERROR,
  EXPO_PUBLIC_COLOR_WARNING: process.env.EXPO_PUBLIC_COLOR_WARNING,
  EXPO_PUBLIC_RESOURCES_URL: process.env.EXPO_PUBLIC_RESOURCES_URL,
  EXPO_PUBLIC_VAPID_KEY: process.env.EXPO_PUBLIC_VAPID_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// Define the schema for validation
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_EMERGENCY_PHONE_NUMBER: z.string(),
  EXPO_PUBLIC_AUTH_CLIENT_ID: z.string(),
  EXPO_PUBLIC_AUTH_ENDPOINT: z.string().url(),
  EXPO_PUBLIC_COLOR_PRIMARY: z.string(),
  EXPO_PUBLIC_COLOR_SECONDARY: z.string(),
  EXPO_PUBLIC_COLOR_ACCENT: z.string(),
  EXPO_PUBLIC_COLOR_SUCCESS: z.string(),
  EXPO_PUBLIC_COLOR_ERROR: z.string(),
  EXPO_PUBLIC_COLOR_WARNING: z.string(),
  EXPO_PUBLIC_RESOURCES_URL: z.string().url(),
  EXPO_PUBLIC_VAPID_KEY: z.string(),

  // NODE_ENV must be one of these values, defaulting to 'development' if not provided.
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate the env object
const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

// Export the validated environment variables with correct types
const env = parsedEnv.data;
export { env };
