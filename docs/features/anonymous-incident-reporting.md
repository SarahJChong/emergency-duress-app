# Anonymous Incident Reporting

## Overview

The anonymous incident reporting feature allows end users to opt-in to raise an incident anonymously on a case-by-case basis. When an incident is marked as anonymous, personally identifiable information (PII) is redacted from the workflow and reporting.

## User Experience

- On the mobile app's welcome screen, users can toggle the "Anonymize my name and mobile" switch before making a distress call
- When the switch is enabled, the UI displays "Anonymous" instead of the user's name and contact number
- The user can still make a distress call based on their location
- The switch is disabled when an incident is active, preventing changes to anonymity status during an active incident

## Technical Implementation

### Data Flow

1. User toggles the anonymous switch in the mobile app
2. When creating an incident, the `isAnonymous` flag is sent to the API
3. The API redacts the following PII fields when `isAnonymous` is true:
   - Name
   - Contact number
   - Room number
4. User ID and Location ID are still stored for all incidents to ensure proper incident management
5. GPS coordinates are still included for all incidents to ensure responders can locate the emergency

### Backend Implementation

The `IncidentController` handles anonymous incidents by:

- Accepting an `isAnonymous` flag in the `CreateIncidentRequest`
- Setting PII fields to null when `isAnonymous` is true
- Including the `isAnonymous` flag in the response

```csharp
// Always store the user ID, even for anonymous incidents
UserId = user.Id,
// For anonymous incidents, we don't include personal information
Name = request.IsAnonymous ? null : user.Name,
ContactNumber = request.IsAnonymous ? null : user.ContactNumber,
// Always include location ID, even for anonymous incidents
LocationId = request.LocationId,
// Only anonymize room number for anonymous incidents
RoomNumber = request.IsAnonymous ? null : request.RoomNumber ?? user.RoomNumber,
// We still include GPS coordinates for all incidents
GpsCoordinates = request.GpsCoordinates,
IsAnonymous = request.IsAnonymous,
```

### Frontend Implementation

The mobile app implements anonymity through:

- A state variable `isAnonymous` that tracks whether the user wants to report anonymously
- A UI switch labeled "Anonymize my name and mobile" that allows users to toggle anonymity
- Conditional rendering that displays "Anonymous" instead of the user's name and contact number when `isAnonymous` is true
- Passing the `isAnonymous` flag to the `createIncident` API call

```typescript
// Create the incident
return createIncident({
  locationId: userData?.location?.id || "",
  roomNumber: userData?.roomNumber || undefined,
  gpsCoordinates,
  isAnonymous: isAnonymous, // Pass the anonymous flag
});
```

### Security Considerations

- While the incident is marked as anonymous in the UI and for reporting purposes, the system explicitly stores the user ID and location ID for all incidents
- The user ID is stored to ensure users can manage their own incidents (close/cancel) and see active incidents after refreshing the app
- Location ID is stored to ensure responders can locate the emergency correctly
- This approach balances user privacy (by redacting personal information) with the need for proper incident management and security
- The anonymous flag is stored with the incident record to ensure consistent handling throughout the incident lifecycle

## Acceptance Criteria

- ✅ Authenticated users can specify that a distress call should be anonymous
- ✅ For anonymous incidents, PII fields (name, contact number, room number) are redacted
- ✅ The distress call number is still based on the user's location
- ✅ The incident record contains date/time, location, and GPS coordinates

## Testing

The feature has been thoroughly tested with:

- Unit tests for the `IncidentController` that verify anonymous incidents are created correctly and PII fields are redacted
- UI tests that verify the anonymous switch works correctly and the UI displays "Anonymous" when appropriate
