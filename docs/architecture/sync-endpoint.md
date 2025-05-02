# Specialized Sync Endpoint for Incident Synchronization

## Overview

This document outlines the design for a specialized sync endpoint to handle incident synchronization from the mobile client. The endpoint will accept a composite payload, allowing the client to both create an incident and cancel it if needed. This design ensures that if an incident is created offline and then cancelled, the backend will create the incident (if it does not already exist) and immediately mark it as cancelled—all in one atomic operation.

## Payload Format

The sync endpoint will accept a JSON payload with the following structure:

```json
{
  "locationId": "string",
  "roomNumber": "string (optional)",
  "gpsCoordinates": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "isAnonymous": "boolean",
  "createdAt": "ISO8601 timestamp",
  "cancellationReason": "string (optional)"
}
```

- If **cancellationReason** is provided, the endpoint will treat the payload as a cancellation request.
- If no cancellationReason is provided, the payload is treated as a normal creation request.

## Backend Logic

1. **Incident Existence Check:**

   - The backend determines if an incident already exists based on a unique identifier. In the absence of a dedicated unique ID, the `createdAt` timestamp may be used in combination with the user's identity.

2. **Handling Cancellation Requests:**

   - **If cancellationReason is provided:**
     - Check if an incident exists for the given payload.
     - If it does not exist, create the incident with status "Open".
     - Then immediately mark the incident as "Cancelled" with the provided cancellationReason.
   - **If no cancellationReason is provided:**
     - Proceed with normal incident creation.

3. **Atomic Operation and Idempotency:**
   - The endpoint will ensure that the operations are idempotent.
   - Useful HTTP status codes and response messages will indicate success or failure of the composite operation.

## Benefits

- **Simplified Frontend Logic:**  
  The client sends a single request regardless of whether the incident is being cancelled or simply created. Backend logic consolidates creation and cancellation, reducing client complexity.

- **Consistency and Reliability:**  
  Centralizing the business logic on the backend ensures consistent state management and error handling, avoiding potential race conditions on the client.

- **Reduced Audit Complexity:**  
  There is no need for the frontend to maintain a separate audit trail of offline cancellations.

## Next Steps

- **Implementation:**  
  Adapt the existing IncidentController to add a new route, e.g., `POST /api/incidents/sync`. Implement the described logic and ensure proper unit and integration testing.

- **Testing:**  
  Develop comprehensive tests covering:

  - Creation of new incidents.
  - Cancellation of incidents that do not exist (triggering automatic creation).
  - Idempotency of the sync operation.

- **Documentation:**  
  Update API documentation to reflect the new sync endpoint and payload requirements.

## Conclusion

This specialized sync endpoint approach consolidates offline incident creation and cancellation into a single API call. It simplifies the mobile client implementation while ensuring robust and consistent incident handling on the backend.
