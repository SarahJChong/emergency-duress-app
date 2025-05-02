using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver.GeoJsonObjectModel;

namespace Api.Models;

using System.Text.Json.Serialization;

/// <summary>
/// Represents the status of an incident/distress call.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IncidentStatus
{
    /// <summary>Incident is currently active and requires attention</summary>
    Open,
    /// <summary>Incident has been resolved by security personnel</summary>
    Closed,
    /// <summary>Incident was cancelled by the user who reported it</summary>
    Cancelled
}

/// <summary>
/// Represents an incident/distress call in the system.
/// </summary>
public class Incident
{
    /// <summary>
    /// Unique identifier for the incident
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string Id { get; set; }

    /// <summary>
    /// Date and time when the incident was reported
    /// </summary>
    [BsonElement("dateCalled")] public DateTime DateCalled { get; set; }

    /// <summary>
    /// Date and time when the incident was closed or cancelled (null if still open)
    /// </summary>
    [BsonElement("dateClosed")] public DateTime? DateClosed { get; set; }

    /// <summary>
    /// Current status of the incident
    /// </summary>
    [BsonElement("status")] public IncidentStatus Status { get; set; }

    /// <summary>
    /// ID of the user who reported the incident
    /// </summary>
    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? UserId { get; set; }

    /// <summary>
    /// Name of the person who reported the incident (may be null for anonymous reports)
    /// </summary>
    [BsonElement("name")] public string? Name { get; set; }

    /// <summary>
    /// Contact number of the person who reported the incident (may be null for anonymous reports)
    /// </summary>
    [BsonElement("contactNumber")] public string? ContactNumber { get; set; }

    /// <summary>
    /// ID of the location where the incident occurred
    /// </summary>
    [BsonElement("locationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string LocationId { get; set; }

    /// <summary>
    /// Room number where the incident occurred (optional)
    /// </summary>
    [BsonElement("roomNumber")] public string? RoomNumber { get; set; }

    /// <summary>
    /// GPS coordinates of the incident location (optional)
    /// </summary>
    [BsonElement("gpsCoordinates")] public GeoJsonPoint<GeoJson2DCoordinates>? GpsCoordinates { get; set; }

    /// <summary>
    /// ID or name of the security responder who closed the incident
    /// </summary>
    [BsonElement("closedBy")] public string? ClosedBy { get; set; }

    /// <summary>
    /// Notes added by security when closing the incident
    /// </summary>
    [BsonElement("closureNotes")] public string? ClosureNotes { get; set; }

    /// <summary>
    /// Reason provided by the user when cancelling the incident
    /// </summary>
    [BsonElement("cancellationReason")] public string? CancellationReason { get; set; }

    /// <summary>
    /// Whether this is an anonymous incident report
    /// </summary>
    [BsonElement("isAnonymous")] public bool IsAnonymous { get; set; }

    /// <summary>
    /// When the incident record was created
    /// </summary>
    [BsonElement("createdAt")] public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the incident record was last updated
    /// </summary>
    [BsonElement("updatedAt")] public DateTime UpdatedAt { get; set; }
}