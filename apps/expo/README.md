# Emergency Duress App - Expo Frontend

A React Native mobile application built with Expo for emergency response and incident management.

## Features

- Real-time incident reporting and tracking
- Offline-first architecture for reliable operation
- Push notifications for immediate alerts
- Location-based incident management
- Cross-platform support (iOS, Android, Web)

## Prerequisites

- Node.js 18 or newer
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- [Optional] iOS Simulator (requires Xcode, macOS only)
- [Optional] Android Emulator (requires Android Studio)

## Environment Configuration

1. Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

2. Configure the environment variables:

| Key                                | Example Value             | Description                                       |
| ---------------------------------- | ------------------------- | ------------------------------------------------- |
| EXPO_PUBLIC_EMERGENCY_PHONE_NUMBER | 1234567                   | Emergency contact number for immediate assistance |
| EXPO_PUBLIC_AUTH_CLIENT_ID         | `<OAuth_clientId>`        | OAuth client ID for authentication                |
| EXPO_PUBLIC_AUTH_ENDPOINT          | `<OAuth_endpoint>`        | OAuth endpoint URL for authentication service     |
| EXPO_PUBLIC_RESOURCES_URL          | `<resources_url>`         | Base URL for accessing application resources      |
| EXPO_PUBLIC_COLOR_PRIMARY          | "#003951"                 | Primary theme color                               |
| EXPO_PUBLIC_COLOR_SECONDARY        | "#04c8c7"                 | Secondary theme color                             |
| EXPO_PUBLIC_COLOR_ACCENT           | "#00A0DE"                 | Accent color for highlights                       |
| EXPO_PUBLIC_COLOR_SUCCESS          | "#24b049"                 | Color for success states                          |
| EXPO_PUBLIC_COLOR_ERROR            | "#F1615E"                 | Color for error states                            |
| EXPO_PUBLIC_COLOR_WARNING          | "#ffcc00"                 | Color for warning states                          |
| EXPO_PUBLIC_VAPID_KEY              | `<your_vapid_public_key>` | VAPID public key for web push notifications       |

Note:

- Values in `<angle_brackets>` should be replaced with your actual values
- VAPID key can be generated using the `web-push generate-vapid-keys` command
- All color values should be valid CSS color codes

## Available Scripts

In the project directory, you can run:

### Development

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

The Expo development server will start, allowing you to:

- Press `w` to run in web browser
- Press `i` to run in iOS simulator (macOS only)
- Press `a` to run in Android emulator
- Scan QR code with Expo Go app on your device

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Building

```bash
# Build for web
npm run build:web

# Build standalone apps (requires Expo account)
npm run build:android
npm run build:ios
```

## Project Structure

```
src/
├── app/              # Expo Router screens and navigation
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Core utilities and services
├── utils/           # Helper functions
└── __tests__/       # Test files
```

## Testing

- Jest is configured for unit and integration testing
- Tests are located alongside the code they test
- Run `npm test` to execute the test suite
- Minimum coverage requirements are enforced

## Offline Support

The app implements an offline-first architecture:

- Incidents can be created and managed offline
- Data is synchronized when connectivity is restored
- Uses local storage for offline data persistence

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Documentation

Additional documentation can be found in the `docs/` directory:

- [Architecture Overview](../../docs/architecture/app-architecture.md)
- [Feature Documentation](../../docs/features)
