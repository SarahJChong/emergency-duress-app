import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Define resource type for type safety
type Resources = {
  en: {
    translation: typeof import("./translations/en.json");
  };
};

// Import locale files
const en = require("./translations/en.json");

const resources: Resources = {
  en: {
    translation: en,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale, // Get the device's current locale
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18n;

// Export type for useTranslation hook
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: Resources;
  }
}
