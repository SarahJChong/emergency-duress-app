import type { ApiLocation } from "./api";
import { getStorageItemAsync, setStorageItemAsync } from "./storage";

export type PendingIncident = {
  locationId: string;
  location?: ApiLocation;
  roomNumber?: string;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
  createdAt: string;
  status: "Open" | "Cancelled";
  cancellationReason?: string;
  cancelledAt?: string;
  name?: string;
};

const PENDING_INCIDENTS_KEY = "pendingIncidents";

export async function storePendingIncident(incident: PendingIncident) {
  const pendingIncidents = await getPendingIncidents();
  const existingIndex = pendingIncidents.findIndex(
    (i) => i.createdAt === incident.createdAt,
  );

  let updatedIncidents: PendingIncident[];
  if (existingIndex >= 0) {
    // Update existing incident
    updatedIncidents = pendingIncidents.map((i, index) =>
      index === existingIndex ? incident : i,
    );
  } else {
    // Add new incident
    updatedIncidents = [...pendingIncidents, incident];
  }

  await setStorageItemAsync(PENDING_INCIDENTS_KEY, updatedIncidents);
}

export async function getPendingIncidents(): Promise<PendingIncident[]> {
  const incidents = await getStorageItemAsync(PENDING_INCIDENTS_KEY);
  return incidents ? (incidents as PendingIncident[]) : [];
}

export async function getOpenPendingIncident(): Promise<PendingIncident | null> {
  const incidents = await getPendingIncidents();
  return incidents.find((incident) => incident.status === "Open") || null;
}

export async function removePendingIncident(createdAt: string) {
  const pendingIncidents = await getPendingIncidents();
  const filtered = pendingIncidents.filter(
    (incident) => incident.createdAt !== createdAt,
  );
  await setStorageItemAsync(PENDING_INCIDENTS_KEY, filtered);
}

export async function cancelPendingIncident(
  createdAt: string,
  reason: string,
): Promise<void> {
  const pendingIncidents = await getPendingIncidents();
  // First check if we already have a cancelled version of this incident
  const hasCancelledVersion = pendingIncidents.some(
    (incident) =>
      incident.createdAt === createdAt && incident.status === "Cancelled",
  );

  // If there's already a cancelled version, don't duplicate
  if (hasCancelledVersion) {
    return;
  }

  const updatedIncidents = pendingIncidents.map((incident) => {
    if (incident.createdAt === createdAt) {
      return {
        ...incident,
        status: "Cancelled" as const,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      };
    }
    return incident;
  });

  await setStorageItemAsync(PENDING_INCIDENTS_KEY, updatedIncidents);
}

export async function syncPendingIncidents(
  syncFn: (request: {
    locationId: string;
    roomNumber?: string;
    latitude?: number;
    longitude?: number;
    isAnonymous?: boolean;
    createdAt: string;
    cancellationReason?: string;
  }) => Promise<unknown>,
): Promise<void> {
  const pendingIncidents = await getPendingIncidents();

  for (const incident of pendingIncidents) {
    try {
      await syncFn({
        locationId: incident.locationId,
        roomNumber: incident.roomNumber,
        latitude: incident.latitude,
        longitude: incident.longitude,
        isAnonymous: incident.isAnonymous,
        createdAt: incident.createdAt,
        cancellationReason:
          incident.status === "Cancelled"
            ? incident.cancellationReason
            : undefined,
      });
      await removePendingIncident(incident.createdAt);
    } catch (error) {
      console.error("Failed to sync incident:", error);
      // Keep incident in storage to retry later
    }
  }
}
