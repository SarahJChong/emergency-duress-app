# Routing Architecture

## Overview

The application uses a role-based routing system to direct users to appropriate sections based on their assigned roles. The routing structure is organized to handle three main user types: end users, security responders, and system administrators.

## Route Structure

```
/                           # Root (redirects based on role)
├── /user                   # End user routes
│   ├── /                  # User dashboard
│   └── /settings          # User settings
│       ├── /profile
│       └── /incidents
├── /security              # Security responder routes
│   └── /                  # Security dashboard
├── /admin                 # Admin routes
│   ├── /                 # Admin dashboard
│   ├── /locations        # Location management
│   ├── /users           # User management
│   └── /settings        # System settings
└── /(auth)               # Authentication routes
    ├── /sign-in
    └── /register
```

## Role-Based Access

### User Types

- **End User**: Regular users (residents) who can raise duress calls and manage their profile
- **Security Responder**: Security personnel who receive and respond to duress calls
- **System Administrator**: Full system configuration access, manages locations and users
- **Company Manager**: Has access to all incident data from all sites

### Access Control

- **/** (Root):

  - Redirects based on user role
  - If not authenticated -> /sign-in
  - If admin role -> /admin
  - If security role -> /security
  - If manager role -> /security
  - Otherwise -> /user

- **/user**:

  - Accessible to users with no role or 'user' role
  - Contains the emergency request interface and user settings
  - Requires registration with location data

- **/security**:

  - Accessible only to users with 'security' or 'manager' role
  - Contains the security dashboard for managing incidents
  - No location registration required
  - Managers have access to view all

- **/admin**:

  - Accessible only to users with 'admin' role
  - Contains system configuration and management features
  - Includes location, user, and system settings management

- **/(auth)**:
  - Public access for authentication
  - Redirects to appropriate dashboard after sign-in

## Implementation Details

### Root Level Routing

The root index performs role checks and redirects to appropriate sections:

```typescript
// app/index.tsx
export default function Index() {
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  if (user?.roles?.includes("admin")) return <Redirect href="/admin" />;
  if (user?.roles?.includes("security") || user?.roles?.includes("manager"))
    return <Redirect href="/security" />;
  return <Redirect href="/user" />;
}
```

### Authorization

- Role checks are performed at the layout level for each section
- Security and admin routes check for specific roles
- User routes allow access with 'user' role or no role
- Authentication state is managed through the useAuth hook

## Future Considerations

- Enhanced authorization with more granular permissions
- Role-based UI customization
- Audit logging for administrative actions
