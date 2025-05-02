# Localization Setup

This document outlines the steps and considerations for adding localization to the Emergency Duress App.

## Overview

Localization has been implemented across the Expo app to support multiple languages. The `i18next` library is used for managing translations, and `react-i18next` integrates it with React components.

### Key Features

- Dynamic language switching
- Localized strings for all user-facing text
- Support for fallback languages

## Implementation Details

### Libraries Used

- `i18next`
- `react-i18next`
- `expo-localization`

### Configuration

The localization setup is initialized in `apps/expo/src/localization/i18n.ts`. It loads translations from JSON files located in `apps/expo/src/localization/translations/`.

### Adding Translations

1. Add a new JSON file in the `translations` directory for the desired language (e.g., `fr.json` for French).
2. Update the `resources` object in `i18n.ts` to include the new language.

### Usage in Components

1. Import the `useTranslation` hook:
   ```tsx
   import { useTranslation } from "react-i18next";
   ```
2. Access translations using the `t` function:
   ```tsx
   const { t } = useTranslation();
   <Text>{t("key")}</Text>;
   ```

## Testing

- Ensure all strings are translated in the supported languages.
- Verify the fallback language works as expected.
- Test dynamic language switching.

## Future Enhancements

- Add more languages as needed.
- Implement a UI for language selection.
