# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🎉 Added

- E2E tests

### 🛠 Changed

### ⚠️ Deprecated

### 🗑 Removed

### 🐛 Fixed

- Fixed location bugs

### 🛡 Security

## [1.0.1] - 2025-04-14

### 🐛 Fixed

- Admin UI page being locked

## [1.0.0] - 2025-04-10

### 🎉 Added

- Added email notifications for security responders:
  - Configurable email notifications using SendGrid
  - HTML and plain text email templates
  - Support for anonymous incidents
  - Comprehensive test coverage for email notification components
  - Detailed setup documentation in docs/setup/email-notifications.md
- Added security route with role-based access control for security responders.
- Added outline variant to Button component:
  - Supports primary, secondary, and destructive color schemes
  - Border and text color match the button's color scheme
  - Comprehensive test coverage added
- Added security responder management features:
  - Company admins can view and manage security responders for each location
  - New API endpoints for adding and removing security responders
  - Comprehensive test coverage for both API and UI components
  - Detailed documentation in docs/features/security-responder-management.md
- more unit tests to satisify coverage
- Security responder page with list of incidents
- Enhanced incident management for security responders:
  - Detailed incident view with duration calculation
  - Modal-based incident closure with required notes
  - Form validation and error handling
  - Updated documentation with new features
- Added in MapView and open in maps button
- Added secure push token management:
  - New `/api/users/me/push-token` endpoint for storing Expo push tokens
  - Comprehensive test coverage for token management
  - Updated notification system documentation
- Added Web Push notification support:
  - Implemented WebPushNotificationService using Web Push API standard
  - VAPID-based authentication for secure web push delivery
  - Support for both web and mobile push notifications
  - Automatic retry mechanism with exponential backoff
  - Comprehensive test coverage for web push components
  - Updated notification system documentation with Web Push details
- Added in OpenTelemetry in backend
- Added in Terms and Conditions pages
- Added in diagnostics options for user
- Added in localization

### 🛠 Changed

- Enhanced Button component size variants:
  - Added extra small (xs) size with compact padding
  - Improved size progression with consistent padding increments
  - Updated each size to affect both text size and padding
  - Added comprehensive test coverage for all size variants
- Reorganized app routing structure:
  - Moved user-specific routes to /user directory
  - Created dedicated security routes under /security
  - Simplified auth layout and role-based routing
- Refactored LocationsController in API to use a dedicated LocationRequest record for create and update operations, better aligning with frontend payload structure
- Enhanced Location model to support security responder management
- Updated location API endpoints to handle security responder operations
- Improved incident management UX:
  - Replaced inline form with modal dialog for incident closure
  - Added calculated duration display for closed incidents
  - Enhanced validation feedback for required closure notes
- Enhanced incident history to limit regular users to last 30 days plus open incidents, while preserving full history for security and managers

### 🛡 Security

- Enhanced push notification security:
  - Secure storage of device tokens in user profiles
  - Authentication required for token registration
  - Token validation and deduplication
  - Token cleanup mechanism
  - Added VAPID-based authentication for Web Push
  - Secure handling of Web Push credentials via environment variables

## [0.1.0] - 2025-03-10

### 🎉 Added

- Added in GitHub workflows
- Added in GitHub documentation
- Created Jest config
- Added telephony integration architectural documentation in docs/architecture/telephony-integration.md with system diagrams.
- Added ability to create incidents
- Added ability to cancel incidents
- Profile section in settings to update profile.
- Anonymous incident creation.
- Detailed documentation.
- Location list and details page.
- useIsOffline hook to check if user is offline.
- Offline banner to show the user they are offline.
- Offline data caching.
- Offline emergency capabilities.
- Added specialized sync endpoint for handling offline incidents and cancellations.
- Added comprehensive test coverage for lib folder:
  - Complete test coverage for storage.ts
  - Enhanced test coverage for offlineIncidents.ts
  - Complete API module tests for incidentApi.ts, locationApi.ts, and userApi.ts
- Added test coverage for utility functions:
  - Created test files for baseUrl.ts and formatDate.ts
  - Added tests for "no access token" error paths in API functions
- Added in basic DropdownMenu into CustomHeader
- Resources URL configuration via env vars.

### 🛠 Changed

- Enhanced offline support to handle incident cancellations while offline.
- Updated incident history to show offline incidents with visual indicators.
- Update status bar color in PWA and add color variables to env
- Return location name for an incident
- Made room number optional in registration, profile, and incident views with appropriate UI handling
- Modularized API code in `apps/expo/src/lib/api.ts` into separate files for better organization and maintainability:
  - Split into `types.ts`, `userApi.ts`, `locationApi.ts`, `incidentApi.ts`, and `index.ts`
  - Added JSDoc comments for better code documentation
  - No functional changes, purely architectural improvement
- Refactored API tests by splitting large api.test.ts into domain-specific test files:
  - Split into incidentApi.test.ts, locationApi.test.ts, and userApi.test.ts
  - Improved test organization and maintainability
  - No functional changes, purely architectural improvement

### 🐛 Fixed

- Dependency issue with `ajv` conflicting with expo and eslint.
- AuthProvider `loadAsync` causing issues on mobile.
- AuthProvider tests fixed.
- API CI pipelines path
- Show location site even if anonymous
- Fixed `userIncidents` query not returning location data, now consistent with `incidentDetails` query
- Fixed cancelled incidents showing as "Open" in the settings/incidents view by properly handling the "Cancelled" status in the UI and invalidating the incidents cache after cancellation
- Fixed unreachable code in baseUrl.ts utility function
