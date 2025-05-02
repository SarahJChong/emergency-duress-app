# Incident History Viewing

This document describes the incident history viewing feature in the Emergency Duress App, which allows users to track the progress of their emergency requests.

## Overview

The incident history viewing feature enables end users to digitally view the stage of their Emergency Requests, tracking their progress including open, closed, and cancelled stages. This provides transparency and allows users to keep track of their past incidents.

## User Stories

### As an End User

I want to digitally view the stage of my Emergency Request, so that I can track its progress including open, closed, and cancelled stages.

## Feature Components

### Backend

The backend provides API endpoints to retrieve incident information:

1. **Get User Incidents** (`GET /api/incident/user`)

   - For regular users: Returns incidents from the last 30 days plus any open incidents
   - For security responders and managers: Returns all incidents
   - Sorted by date called (newest to oldest)
   - Includes all incident statuses (Open, Closed, Cancelled)
   - Filtering based on user role ensures efficient data retrieval

2. **Get Incident Details** (`GET /api/incident/{id}`)
   - Returns detailed information about a specific incident
   - Includes all incident fields
   - Enforces security to ensure users can only view their own incidents

### Frontend

The frontend provides user interfaces to view incident information:

1. **Incident List View** (`/settings/incidents`)

   - Accessible from the Settings page
   - Displays filtered list of incidents based on user role
   - Shows key information: date called, status, location
   - Sorted by date (newest to oldest)

2. **Incident Details View** (`/settings/incidents/[id]`)
   - Displays detailed information about a specific incident
   - Shows all relevant fields based on incident status
   - All fields are read-only

## Incident Statuses

Incidents can have one of the following statuses:

1. **Open**: When a call has been initiated by the end user, and it is in progress
2. **Closed**: When a call has been resolved by a Security responder
3. **Cancelled**: When a call has been cancelled by the Village Resident

## Fields Displayed

### Incident List View

- Date called
- Status
- Location

### Incident Details View

- Date called
- Status
- Name (e.g. null if Anonymous)
- Location (displays the location name, or "Anonymous" for anonymous incidents)
- Room number (e.g. null if Anonymous)

Additional fields based on status:

- **Closed**: Date closed, Closed by, Closure notes
- **Cancelled**: Date cancelled, Cancellation reason

## Anonymous Incidents

The system supports anonymous incident reporting. For anonymous incidents:

- Personal information (name, contact number, room number) is not displayed
- Location information is marked as "Anonymous"

## Implementation Details

### API Endpoints

```
GET /api/incident/user
```

Returns a list of all incidents for the current user.

```
GET /api/incident/{id}
```

Returns detailed information about a specific incident, including location details when a location ID is provided. The response uses the `IncidentDetailsResponse` class which extends the `Incident` model to include the associated `Location` object.

### Frontend Routes

```
/settings/incidents
```

Displays the incident list view.

```
/settings/incidents/[id]
```

Displays the incident details view.

## Testing

The feature includes comprehensive testing:

1. **Backend Tests**

   - Unit tests for the IncidentController endpoints
   - Tests for different user roles (regular users, security responders, managers)
   - Tests for date filtering and status-based filtering

2. **Frontend Tests**
   - Unit tests for the query hooks
   - Component tests for the incident list and detail views
   - Tests for different states (loading, error, empty, with data)

## Future Enhancements

Potential future enhancements for this feature:

1. Filtering incidents by status
2. Searching incidents by date or location
3. Pagination for users with many incidents
4. Exporting incident history to PDF or CSV
5. Push notifications for incident status changes
