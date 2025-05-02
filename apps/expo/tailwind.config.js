import { withTV } from "tailwind-variants/transformer";

// import { env } from "@/env";

/** @type {import('tailwindcss').Config} */
export default withTV({
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  // eslint-disable-next-line no-undef
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#003951",
        secondary: "#04c8c7",
        accent: "#00A0DE",
        success: "#24b049",
        error: "#F1615E",
        warning: "#ffcc00",
      },
    },
  },
  plugins: [],
});
