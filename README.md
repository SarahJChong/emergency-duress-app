# Emergency Duress App

[![Expo App CI](https://github.com/SarahJChong/emergency-duress-app/actions/workflows/expo.yml/badge.svg)](https://github.com/SarahJChong/emergency-duress-app/actions/workflows/expo.yml)
[![.NET API CI](https://github.com/SarahJChong/emergency-duress-app/actions/workflows/api.yml/badge.svg)](https://github.com/SarahJChong/emergency-duress-app/actions/workflows/api.yml)

A comprehensive emergency response system designed to provide immediate assistance in duress situations. The application allows users to quickly signal for help, while enabling security responders to efficiently manage and respond to incidents.

## Getting Started

For complete setup and configuration instructions, check out our [Getting Started Guide](docs/setup/README.md). This guide covers:

- Authentication setup with sample Auth0 configuration
- Email notifications setup with SendGrid integration
- Other essential configuration steps

## Features

- Quick emergency signal activation
- Real-time incident tracking and management
- Offline support for reliable operation
- Multi-platform support (iOS, Android, Web)
- Secure communication channels

## Tech Stack

**Frontend:**

- [Expo](https://expo.dev/) - React Native framework
- [React Native](https://reactnative.dev/) - Mobile app framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [React Query](https://tanstack.com/query/latest) - Data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

**Backend:**

- [.NET 8](https://dotnet.microsoft.com/) - API framework
- [MongoDB](https://www.mongodb.com/) - Database

## Documentation

Detailed documentation can be found in the following locations:

- [API Documentation](apps/Api) - API endpoints and integration details
- [Architecture Overview](docs/architecture) - System design and components
- [Feature Documentation](docs/features) - Detailed feature descriptions
- [Getting Started Guide](docs/setup/README.md) - Setup and configuration instructions

## Getting Started

Clone the project

```bash
git clone https://github.com/SarahJChong/emergency-duress-app.git
cd emergency-duress-app
```

### Frontend (Expo App)

```bash
# Navigate to Expo app directory
cd apps/expo

# Install dependencies
npm install

# Start the development server
npm start
```

The Expo development server will start, and you can:

- Press `w` to open in web browser
- Use Expo Go app on your mobile device to scan the QR code
- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator

### Backend (.NET API)

```bash
# Navigate to API directory
cd apps/api

# Restore .NET dependencies
dotnet restore

# Start the API in development mode
dotnet run --project Api
```

The API will start on `http://localhost:5000` by default.

### Development Requirements

- Node.js 18 or newer
- .NET SDK 8.0 or newer
- MongoDB (for API)
- Expo CLI (`npm install -g expo-cli`)
- [Optional] iOS Simulator (Xcode) or Android Emulator

## Available Scripts

Each application (Expo and API) has its own set of scripts for development, testing, and deployment.
See the respective README files in [apps/expo](apps/expo) and [apps/api](apps/api) for detailed
information about available commands and their usage.

## Contributing

For information on how to contribute to this project, please see the [contribution guide](/CONTRIBUTING.md).

Please adhere to this project's [code of conduct](/CODE_OF_CONDUCT.md).

## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)

See [License](/LICENSE).
