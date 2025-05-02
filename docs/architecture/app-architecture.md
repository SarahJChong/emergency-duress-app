# Application Architecture

## Introduction

The Emergency Duress Application is a cross-platform mobile and web application built using modern technologies and following a client-server architecture, with an offline-first approach. The application is designed to handle emergency situations efficiently and reliably with or without an internet connection.

## Technical Stack

The application uses a modern technology stack chosen for reliability, scalability, and cross-platform capabilities:

| Layer    | Technology          | Purpose                                   |
| -------- | ------------------- | ----------------------------------------- |
| Frontend | React Native / Expo | Cross-platform mobile and web development |
|          | TypeScript          | Type-safe development                     |
|          | TailwindCSS         | Consistent styling across platforms       |
|          | Tanstack Query      | Powerful asynchronous state management    |
|          | Jest                | Component and integration testing         |
| Backend  | .NET 8              | Robust API development                    |
|          | MongoDB 3.1         | Document database for flexible storage    |
|          | Docker              | Containerization and deployment           |

### Frontend Architecture (apps/expo)

[Previous frontend architecture section remains unchanged...]

### Backend Architecture (apps/api)

The backend follows a layered architecture pattern using .NET 8:

#### ASP.NET Architecture

```mermaid
graph TD
    subgraph "Models"
        M1[Incident]
        M2[Location]
        M3[User]
    end

    subgraph "Controllers"
        A1[Incidents Controller]
        A2[Users Controller]
        A3[Locations Controller]
    end

    subgraph "Services"
        S1[IRepository]
        S2[Authentication]
        S3[NotificationService]
        S4[EmailNotificationService]
        S5[ExpoPushNotificationService]
        S6[WebPushNotificationService]
    end

    S3 -->|Uses| S4
    S3 -->|Uses| S5
    S3 -->|Uses| S6
    A1 -->|Uses| S3
    A2 -->|Uses| S3
```

#### API Endpoints

| Endpoint         | Method | Purpose                     | Authentication |
| ---------------- | ------ | --------------------------- | -------------- |
| `/api/locations` | GET    | Returns a list of locations | Required       |

3i **/security**: Security responder routes

- Security dashboard for managing incidents
- Only accessible to users with 'security' role

When deployed to iOS and Android it will be a native application, and use platform native componentsg **IT IS NOT A WEBVIEW**

#### Routing Architecture

The application uses Expo Router for file-based routing, with a role-based access control structure:

```mermaid
graph TD
    A[App Root] --> B{Check Auth}
    B -->|Not Authenticated| C[Auth Routes]
    B -->|Authenticated| D{Check Role}
D -->|Security| E[Security Dashboard]
D -->|User/No Role| F[User Dashboard]

    subgraph Auth Routes
    C --> G[Sign In]
    C --> H[Register]
    end

    subgraph User Routes
    F --> I[Emergency Request]
    F --> J[Settings]
    J --> K[Profile]
    J --> L[Incidents]
    end

    subgraph Security Routes
    E --> M[Manage Incidents]
    end
```

The routing structure is organized into three main sections:

1. **(auth)**: Public authentication routes

   - /sign-in: OAuth-based authentication
   - /register: User registration (location assignment)

2. **/user**: End user (resident) routes

   - Main dashboard with emergency request functionality
     ---- - Settings section for profile and incident management
   - Only accessib le to users with 'user' role or no specific role

3. **/security**: Security responder routes
   - Security dashboard for managing incidents
   - Only accessible to users with 'security' role

When deployed to iOS and Android it will be a native application, and use platform native components. **IT IS NOT A WEBVIEW**

#### Component Architecture

| Component Type    | Purpose         | Implementation Details                  |
| ----------------- | --------------- | --------------------------------------- |
| Form Controls     | User Input      | Input, Select, Checkbox with validation |
| Platform Specific | Native Features | Platform-optimized components           |

### Backend Architecture (apps/api)

The backend follows a layered architecture pattern using .NET 8:

#### ASP.NET Architecture

```mermaid
graph TD
    subgraph "Models"
    M1[Incident]
    M2[Location]
    M3[User]
    end

    subgraph "Controllers"
        A1[Incidents Controller]
        A2[Users Controller]
        A3[Locations Controller]
    end

    subgraph "Services"
        S1[IRepository]
        S2[Authentication]
        S3[NotificationService]
        S4[EmailNotificationService]
        S5[ExpoPushNotificationService]
        S6[WebPushNotificationService]
    end

    S3 -->|Uses| S4
    S3 -->|Uses| S5
    S3 -->|Uses| S6
    A1 -->|Uses| S3
    A2 -->|Uses| S3
```

#### API Endpoints

| Endpoint                   | Method | Purpose                     | Authentication |
| -------------------------- | ------ | --------------------------- | -------------- |
| `/api/locations`           | GET    | Returns a list of locations | Required       |
| `/api/incidents`           | POST   | Create emergency incident   | Required       |
| `/api/incidents/active`    | GET    | Get user's active incident  | Required       |
| `/api/incidents/cancel`    | POST   | Cancel active incident      | Required       |
| `/api/users`               | GET    | List users                  | Admin Only     |
| `/api/users/me`            | GET    | Get your user details       | Required       |
| `/api/users/me`            | PUT    | Update your profile         | Required       |
| `/api/users/me/push-token` | PUT    | Update push token           | Required       |

**Note:** Users can only have one active incident at a time. Attempting to create a new incident while one is active will result in a BadRequest response.

## Offline-first approach

The application is designed with an offline-first approach, ensuring that critical functionality remains available even when network connectivity is limited or unavailable. This approach is essential for emergency applications that must function reliably in all conditions.

### Key Components

- **TanStack Query**: Core data fetching and state management library
- **AsyncStorage Persister**: Persistence layer for caching query results
- **Network State Management**: Detection and handling of connectivity changes
- **Optimistic Updates**: UI updates before server confirmation
- **Background Synchronization**: Automatic retry of failed requests when connectivity is restored

### Implementation Highlights

- Query results are persisted to device storage for offline access
- Network connectivity is actively monitored to adjust application behavior
- Failed API requests are automatically retried when connectivity is restored
- The UI provides clear indicators of offline status and available functionality

For detailed information on the offline-first implementation, see the [Offline-First Implementation](./offline-first.md) documentation.

## Anonymous Incident Reporting

The application supports anonymous incident reporting, allowing users to opt-in to raise incidents anonymously on a case-by-case basis. When an incident is marked as anonymous:

- Personal identifiable information (PII) is redacted from the workflow and reporting
- The user's name, contact number, and room number are hidden
- The incident is still linked to the user internally for tracking purposes
- GPS coordinates are still included to ensure responders can locate the emergency

This feature balances user privacy with the need for effective emergency response. Users can toggle anonymity via a switch on the mobile app's welcome screen before making a distress call.

## Flows

Below are some flow diagrams of the application.

### Incident Creation Flow

```mermaid
sequenceDiagram
    participant Client as Mobile/Web Client
    participant API as API Server
    participant DB as MongoDB
    participant Security as Security Team

    Note over Client,Security: Incident Creation Process

    Client->>+API: POST /api/incident
    Note right of Client: Payload: {<br/>locationId,<br/>roomNumber,<br/>gpsCoordinates,<br/>isAnonymous<br/>}

    API->>DB: Check for active incidents
    DB-->>API: Active incident status

    alt Has Active Incident
        API-->>Client: 400 Bad Request
    else No Active Incident
        API->>+DB: Create incident record
        Note right of API: If isAnonymous is true,<br/>PII fields are redacted
        DB-->>-API: Incident ID

        API->>Security: Notify
        Note right of API: Incident details<br/>and location

        API-->>Client: 201 Created
        Note left of API: Response: {<br/>incidentId,<br/>timestamp,<br/>status: "ACTIVE",<br/>isAnonymous<br/>}
    end
```

### Incident Cancellation Flow

```mermaid
sequenceDiagram
    participant Client as Mobile/Web Client
    participant API as API Server
    participant DB as MongoDB

    Client->>+API: POST /api/incident/cancel
    Note right of Client: Payload: {<br/>cancellationReason<br/>}

    API->>DB: Find active incident
    DB-->>API: Active incident

    alt No Active Incident
        API-->>Client: 404 Not Found
    else Has Active Incident
        API->>DB: Update incident status
        Note right of API: Set status to Cancelled<br/>Record cancellation reason<br/>Set dateClosed
        API-->>Client: 200 OK
        Note left of API: Updated incident details
    end
```

### User Registration Flow

```mermaid
sequenceDiagram
    participant Client as Mobile/Web Client
    participant API as API Server
    participant DB as MongoDB
    participant Auth as Auth Service

    Note over Client,Auth: Registration Process

    Client->>+API: GET /api/locations
    API->>+DB: Query locations
    DB-->>-API: Available locations
    API-->>-Client: List of locations

    Client->>+API: POST /api/users/register
    Note right of Client: Payload: {<br/>locationId,<br/>roomNumber,<br/>contactNumber<br/>}

    API->>+Auth: Validate credentials
    Auth-->>-API: Validation result

    API->>+DB: Check if user exists
    DB-->>-API: user status

    alt User already exists
        API-->>+MongoDB: Update user record
    else User doesn't exist
        API->>+DB: Create user record
        DB-->>-API: User ID
    end
    API-->>Client: 201 Created
    Note left of API: Response: OK
```

### Emergency Response Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    participant Security
    participant Database

    User->>App: Initiates Emergency
    App->>API: POST /api/incident
    API->>Database: Create Incident
    API->>Security: Notify Security Team
    API->>App: Return Incident ID
    App->>User: Show Active Incident

    loop Status Updates
        Security->>API: Update Status
        API->>Database: Update Incident
        API->>App: Push Update
        App->>User: Show Status
    end

    Security->>API: Mark Resolved
    API->>Database: Close Incident
    API->>App: Push Resolution
    App->>User: Show Resolution
```

### Authentication Flow

The application uses OAuth 2.0 with OpenID Connect (OIDC) for authentication, implementing the Authorization Code Flow with PKCE (Proof Key for Code Exchange) for enhanced security.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant OAuth Provider
    participant API

    User->>App: Initiate Social Login
    App->>App: Generate Code Verifier & Challenge
    App->>OAuth Provider: Redirect to OAuth login with code challenge
    OAuth Provider->>User: Authenticate & Consent
    User->>OAuth Provider: Approve Access
    OAuth Provider->>App: Authorization Code
    App->>OAuth Provider: Exchange Code for Tokens (with code verifier)
    OAuth Provider->>App: Access, ID & Refresh Tokens (JWTs)
    App->>App: Store Tokens Securely
    App->>API: API Requests with Access Token
    API->>App: Protected Resources

    Note over App,API: Token Refresh Flow
    App->>App: Detect Token Expiration
    App->>OAuth Provider: Request Token Refresh
    OAuth Provider->>App: New Access, ID & Refresh Tokens
    App->>App: Update Stored Tokens
```

#### Authentication Components

The frontend implements authentication through several key components:

1. **AuthProvider**: React context provider that manages authentication state

   - Handles token storage, refresh, and authentication flows
   - Provides authentication status and user information to the application

2. **useAuth Hook**: Custom React hook for accessing authentication functionality

   - Provides methods for sign-in, sign-out, and checking authentication status
   - Exposes user information and session details

3. **Token Management**:
   - Secure token storage using platform-specific mechanisms
   - Automatic token refresh when expired
   - Token validation and parsing

#### Role-Based Access Control

The application implements role-based access control using custom claims in the ID token:

```json
{
  "Authentication": {
    "Authority": "", // Auth0 authority URL
    "Audience": "", // API audience identifier
    "RoleClaimType": "emergency_app/roles"
  }
}
```

The authentication configuration is managed through appsettings.json and should be properly secured using environment variables in production.

- Roles are included in the ID token as a custom claim: `emergency_app/roles` (configured via Authentication:RoleClaimType setting)
- The frontend checks roles for conditional rendering of UI elements
- The backend verifies roles for protecting API endpoints

```typescript
// Example role check in frontend
const { user } = useAuth();
const isAdmin = user?.roles.includes("admin");

// Conditional rendering based on role
{
  isAdmin && <AdminPanel />;
}
```

```csharp
// Example role check in backend
[Authorize(Roles = "admin")]
[HttpGet]
public async Task<IActionResult> GetAdminData()
{
    // Only accessible to users with admin role
}
```

## Security Architecture

### Authentication & Authorization

```mermaid
graph TD
    A[Request] --> B{Has OAuth Token?}
    B -->|Yes| C[Validate Token with OAuth Provider]
    B -->|No| D[Redirect to OAuth Login]
    C -->|Valid| E[Check Permissions]
    C -->|Invalid| D
    E -->|Authorized| F[Process Request]
    E -->|Unauthorized| G[Return 403 Forbidden]
    D --> H[User Logs in via OAuth]
    H --> I[Exchange Auth Code for Token]
    I --> J[Store Session & Token]
    J --> B
```

## Monitoring and Observability

### OpenTelemetry Collection

```mermaid
graph TD
    A[Application Metrics] --> D[OpenTelemetry System]
    B[System Metrics] --> D
    C[User Metrics] --> D
```
