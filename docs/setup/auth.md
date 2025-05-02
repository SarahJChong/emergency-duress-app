# Authentication Setup

## Overview

The Emergency Duress App uses Auth0 for authentication with OAuth 2.0 and OpenID Connect (OIDC), implementing the Authorization Code Flow with PKCE (Proof Key for Code Exchange) for enhanced security.

## API Configuration

Authentication settings are configured in `appsettings.json`:

```json
{
  "Authentication": {
    "Authority": "Auth0 authority URL",
    "Audience": "API audience identifier",
    "RoleClaimType": "emergency_app/roles"
  }
}
```

### Configuration Values

| Setting       | Description                        | Example                                   |
| ------------- | ---------------------------------- | ----------------------------------------- |
| Authority     | The Auth0 domain URL               | https://dev-8b2x36lk8vrap754.us.auth0.com |
| Audience      | The unique identifier for your API | http://localhost:5052/                    |
| RoleClaimType | The claim type used for roles      | emergency_app/roles                       |

### Development Settings

For local development, these values are configured in `appsettings.Development.json`. In production, they should be provided through environment variables or secure configuration management.

## Role-Based Access Control

The application uses Auth0's roles feature to implement role-based access control:

1. Roles are included in the ID token as a custom claim (`emergency_app/roles`)
2. The API validates roles through JWT token validation
3. Controllers use the `[Authorize(Roles = "...")]` attribute to protect endpoints
4. The frontend checks roles for conditional rendering of UI elements

### Available Roles

- `user`: Standard user with access to emergency features
- `security`: Security responder with access to incident management
- `admin`: Administrator with full system access

## Implementation

### API Authentication Setup

The API configures JWT Bearer authentication in `Program.cs`:

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Authority = builder.Configuration["Authentication:Authority"];
    options.Audience = builder.Configuration["Authentication:Audience"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        RoleClaimType = builder.Configuration["Authentication:RoleClaimType"]
    };
});
```

### Protecting API Endpoints

```csharp
[Authorize(Roles = "admin")]
[HttpGet]
public async Task<IActionResult> GetAdminData()
{
    // Only accessible to users with admin role
}
```

### Frontend Role Checks

```typescript
const { user } = useAuth();
const isAdmin = user?.roles.includes("admin");

// Conditional rendering based on role
{
  isAdmin && <AdminPanel />;
}
```

## Security Considerations

1. Always use HTTPS in production
2. Implement proper token storage and refresh mechanisms
3. Keep Auth0 configuration secured and never commit sensitive values
4. Regularly rotate secrets and review access patterns
   const { user } = useAuth();
   const isAdmin = user?.roles.includes("admin");

// Conditional rendering based on role
{
isAdmin && <AdminPanel />;
}

````

### Example Role Check (Backend)

```csharp
[Authorize(Roles = "admin")]
[HttpGet]
public async Task<IActionResult> GetAdminData()
{
    // Only accessible to users with admin role
}
````

## Security Considerations

1. **Token Expiration**

   - Access tokens have a short lifetime (typically 1 hour)
   - Refresh tokens have a longer lifetime but are securely stored
   - The application handles token expiration and refresh automatically

2. **HTTPS**

   - All communication with the identity provider and API uses HTTPS
   - Tokens are never transmitted over insecure connections

3. **Token Validation**

   - The API validates tokens for:
     - Signature validity
     - Expiration time
     - Issuer
     - Audience
     - Required scopes

4. **Logout Handling**
   - Proper logout removes all tokens from storage
   - Session invalidation on the identity provider side

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**

   - Ensure the redirect URI in your IdP configuration matches the one used by the application
   - For Expo, use `makeRedirectUri()` to generate the correct URI

2. **Token Refresh Failures**

   - Check that refresh tokens are properly stored
   - Verify that refresh tokens haven't expired or been revoked
   - Ensure the correct scopes are requested (`offline_access` is required for refresh tokens)

3. **Missing Custom Claims**
   - Verify that IdP rules are properly configured
   - Check the namespace used for custom claims

### Debugging Authentication

The application includes authentication error logging that can help diagnose issues:

```typescript
// Authentication errors are logged with a descriptive prefix
set({
  authError: `[ERROR] SignIn: ${error.message || "an error occurred"}`,
});
console.error(errorString);
```

## References

- [Auth0 Documentation](https://auth0.com/docs)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Auth0 Custom Claims](https://community.auth0.com/t/adding-custom-claims-to-tokens/84590)
- [Token Storage Best Practices](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)
