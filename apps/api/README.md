# Emergency Duress App - .NET API

The backend API service for the Emergency Duress App, built with .NET 8 and MongoDB.

## Features

- RESTful API endpoints for incident management
- Real-time notifications system
- MongoDB integration for data persistence
- Docker support for easy deployment
- Comprehensive test coverage

## Prerequisites

- .NET SDK 8.0 or newer
- MongoDB
- Docker (optional)

## Getting Started

### Local Development

1. Restore dependencies:

```bash
dotnet restore
```

2. Configure MongoDB connection:

   - Update `appsettings.json` with your MongoDB connection string
   - Or set the connection string in environment variables

3. Run the API:

```bash
dotnet run --project Api
```

The API will start on `http://localhost:5000` by default.

### Docker Development

1. Build the container:

```bash
docker compose build
```

2. Start the services:

```bash
docker compose up
```

## Project Structure

```
Api/
├── Controllers/         # API endpoint controllers
├── Models/             # Data models and DTOs
├── Services/           # Business logic and services
│   └── Notifications/  # Notification system
└── Properties/         # Launch and configuration
```

## API Endpoints

- `GET /api/incidents` - List all incidents
- `POST /api/incidents` - Create new incident
- `GET /api/incidents/{id}` - Get incident details
- `PUT /api/incidents/{id}` - Update incident
- `GET /api/locations` - List available locations
- `GET /api/users` - List users

For detailed API documentation, run the application and visit `/swagger`.

## Testing

Run the test suite:

```bash
dotnet test
```

Tests are organized in the `Api.Tests` project:

- Controller tests
- Service layer tests
- Integration tests

## Configuration

Key configuration options in `appsettings.json`:

```json
{
  "Authentication": {
    "Authority": "", // Auth0 authority URL
    "Audience": "", // API audience identifier
    "RoleClaimType": "emergency_app/roles"
  },
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "EmergencyDuress"
  },
  "Notifications": {
    "Email": {
      "Enabled": true,
      "Provider": "SendGrid"
    },
    "Push": {
      "Enabled": true,
      "Provider": "Expo"
    }
  }
}
```

## Contributing

Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Documentation

Additional documentation can be found in the `docs/` directory:

- [API Architecture](../../docs/architecture/app-architecture.md)
- [Database Design](../../docs/architecture/database-design.md)
- [Notification System](../../docs/architecture/notification-system.md)
