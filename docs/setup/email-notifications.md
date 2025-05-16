# Email Notification Setup

The emergency duress application supports sending email notifications to security responders when an incident is raised. This document outlines the configuration and setup process.

## Configuration

## SendGrid Setup

1. **Create a SendGrid Account**

   - Visit [SendGrid](https://sendgrid.com) and sign up for an account if you haven't already
   - Complete the account verification process

2. **Create API Key**

   - Log in to your SendGrid dashboard
   - Navigate to Settings > API Keys
   - Click "Create API Key"
   - Name it specifically for the Emergency Duress App (e.g., "emergency-duress-emails")
   - Select "Restricted Access" and enable only the "Mail Send" permission
   - Save and securely copy your API key - it will only be shown once

3. **Verify Sender Identity**

   - In the SendGrid dashboard, go to Settings > Sender Authentication
   - Follow the steps to verify your sender domain or email address
   - This is required to ensure reliable email delivery

4. **Configure API Key**

   - Store your SendGrid API key securely using environment variables:
     ```bash
     NOTIFICATIONS__SENDGRID__APIKEY=your-sendgrid-api-key
     ```
   - Alternatively, use your secure configuration management system
   - Never commit API keys to version control

5. **Test Integration**
   - Send a test email using the configuration in the Testing section below
   - Verify the email is received and properly formatted
   - Check SendGrid's Activity Feed to confirm successful delivery

For additional details and best practices, refer to the [SendGrid Documentation](https://sendgrid.com/docs).

### 1. Email Settings

In `appsettings.json` (or environment variables), configure the following email notification settings:

```json
{
  "Notifications": {
    "Email": {
      "DefaultSenderEmail": "your-sender@example.com",
      "DefaultSenderName": "Emergency Duress System",
      "WebAppBaseUrl": "https://your-webapp-url.com"
    }
  }
}
```

- `DefaultSenderEmail`: The email address that will appear as the sender
- `DefaultSenderName`: The display name for the sender
- `WebAppBaseUrl`: The base URL of your web application (used for "Open In App" links)

### 2. SendGrid Configuration

The application uses SendGrid as the email service provider. Configure your SendGrid settings:

```json
{
  "Notifications": {
    "SendGrid": {
      "ApiKey": "your-sendgrid-api-key"
    }
  }
}
```

For security reasons, it's recommended to set the SendGrid API key using environment variables:

```bash
NOTIFICATIONS__SENDGRID__APIKEY=your-sendgrid-api-key
```

## Email Template

When an incident is raised, security responders receive an email with the following structure:

- **Subject**: "Duress call: {Location}"
- **From**: Configured default sender
- **Body**:
  - Link to open the incident in the web application
  - Date and time of the incident
  - Caller's name (or "Anonymous")
  - Contact number (or "Anonymous")
  - Location details
  - Room number (if provided)
  - Google Maps link (if GPS coordinates are available)

## Configuring Email Recipients

Each location must be configured with a default email address that will receive notifications when an incident is raised at that location. To configure this:

1. When creating or editing a location, provide a valid email address in the "Default Email" field
2. This email address will receive all incident notifications for that location

## Testing

To verify email notifications are working:

1. Configure a test security responder with a valid email address
2. Assign them to a location
3. Create a test incident for that location and verify the email is sent to the location's default email address
4. Verify the email is received with the correct information

## Troubleshooting

Common issues and solutions:

1. **Emails not being sent**

   - Verify SendGrid API key is correctly configured
   - Check application logs for any SendGrid API errors
   - Ensure the location has a valid default email address configured

2. **Missing "Open In App" links**

   - Verify WebAppBaseUrl is correctly configured
   - Check that incident IDs are being properly included in the URLs

3. **Anonymous calls**
   - For incidents marked as anonymous, verify that caller name and contact number are replaced with "Anonymous" in the email

## Implementation Details

The email notification system follows a pluggable design:

- `IEmailNotificationService`: Interface defining email notification capabilities
- `SendGridEmailNotificationService`: Current implementation using SendGrid
- Configuration via dependency injection in `Program.cs`

This design allows for future implementation of alternative email providers if needed.
