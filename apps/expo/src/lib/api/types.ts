/**
 * User registration details required for API registration
 */
export type RegistrationDetails = {
  contactNumber: string;
  roomNumber?: string;
  locationId: string;
};

/**
 * Security responder information stored with locations
 */
export type SecurityResponder = {
  id: string;
  name: string;
  email: string;
};

/**
 * Location information returned by the API
 */
export type ApiLocation = {
  id: string;
  name: string;
  defaultPhoneNumber: string;
  defaultEmail: string;
  createdAt: Date;
  updatedAt: Date;
  securityResponders: SecurityResponder[];
  hasIncidents: boolean;
};

/**
 * MongoDB GeoJSON Point coordinates as returned by the API
 */
export type MongoGeoJsonCoordinates = {
  values: number[]; // [longitude, latitude]
  x: number; // longitude
  y: number; // latitude
};

/**
 * MongoDB GeoJSON Point as returned by the API
 */
export type MongoGeoJsonPoint = {
  coordinates: MongoGeoJsonCoordinates;
  type: number; // 7 for Point
  boundingBox: null;
  coordinateReferenceSystem: null;
  extraMembers: null;
};

/**
 * Incident information returned by the API
 */
export type ApiIncident = {
  id: string;
  dateCalled: Date;
  dateClosed?: Date;
  status: "Open" | "Closed" | "Cancelled";
  userId?: string;
  name?: string;
  contactNumber?: string;
  locationId?: string;
  location?: ApiLocation;
  roomNumber?: string;
  gpsCoordinates?: MongoGeoJsonPoint;
  closedBy?: string;
  closureNotes?: string;
  cancellationReason?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * User information returned by the API
 */
export type UserResponse = {
  id: string;
  externalId: string;
  name: string;
  email: string;
  contactNumber?: string | null;
  roomNumber?: string | null;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  location?: ApiLocation | null;
  // List of roles assigned to the user from the identity provider
  roles: string[];
};
