# Role and Permission Structure

## Overview

The application implements a role-based access control (RBAC) system to manage different user types and their permissions. Authentication is handled through OIDC and OAuth Access Tokens to ensure secure role-based access.

## User Roles

### End User (Village Resident)

- **Access Level**: Basic user access
- **Permissions**:
  - Log into mobile app
  - Access their assigned location's features
  - Create and manage duress calls
  - View their own incident history
  - Update their profile

### Security Responder

- **Access Level**: Security dashboard access
- **Permissions**:
  - Access web app
  - View distress calls (restricted to their location)
  - Manage and respond to duress requests
  - View incident details and history

### Company Manager

- **Access Level**: Company-wide view
- **Permissions**:
  - Access web app
  - View all distress calls (all locations)
  - Assigned based on identity provider role

### Company Administrator

- **Access Level**: System administration
- **Permissions**:
  - Access web app
  - Modify locations and related data
  - Add security responders to locations
  - Full system configuration access
  - Assigned based on identity provider role

## Role Assignment

- End users are automatically assigned upon successful login
- Security responders must be added to a location by Company admin
- Company manager and admin roles are assigned through the identity provider
- Users can have multiple roles (e.g., security responder + company manager)

## Role Validation

- Role claims are provided via the OIDC identity token
- Roles are stored in the `emergency_app/roles` claim
- Access tokens include role information for API authorization
- Role checks are performed at both frontend routing and API levels

## Implementation

### Frontend Role Checks

```typescript
// Example role check in layout
if (user?.roles?.includes("security")) {
  // Allow access to security features
} else {
  // Redirect to appropriate route
}
```

### API Authorization

```csharp
// Example API authorization attribute
[Authorize(Roles = "security,company_admin")]
public class SecurityController : ControllerBase
{
    // Protected endpoints
}
```

## Security Considerations

- Role assignments should be regularly audited
- Role changes should be logged for security tracking
- Access token expiration and refresh policies should be enforced
- Regular security reviews of role-based access controls
