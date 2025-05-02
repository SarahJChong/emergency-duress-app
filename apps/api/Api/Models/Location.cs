using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Api.Models;

/// <summary>
/// Record representing a security responder assigned to a location
/// with minimal required information.
/// </summary>
public record SecurityResponder
{
    /// <summary>User's unique identifier from the database.</summary>
    [BsonElement("id")] public required string Id { get; init; }

    /// <summary>User's full name.</summary>
    [BsonElement("name")] public required string Name { get; init; }

    /// <summary>User's email address.</summary>
    [BsonElement("email")] public required string Email { get; init; }
}

/// <summary>
///     Represents a location configured by the administrator.
/// </summary>
public class Location
{
    /// <summary>
    /// Unique identifier for the location
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string Id { get; set; }

    /// <summary>
    /// Unique name for the location (e.g., Camp Alpha)
    /// </summary>
    [BsonElement("name")] public required string Name { get; set; }

    /// <summary>
    /// Default contact phone number for this location
    /// </summary>
    [BsonElement("defaultPhoneNumber")] public required string DefaultPhoneNumber { get; set; }

    /// <summary>
    /// Default contact email for this location
    /// </summary>
    [BsonElement("defaultEmail")] public required string DefaultEmail { get; set; }

    /// <summary>
    /// List of security responders assigned to this location
    /// </summary>
    [BsonElement("securityResponders")]
    public List<SecurityResponder> SecurityResponders { get; set; } = [];

    /// <summary>
    /// When the location record was created
    /// </summary>
    [BsonElement("createdAt")] public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the location record was last updated
    /// </summary>
    [BsonElement("updatedAt")] public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Indicates whether there are any incidents associated with this location
    /// </summary>
    [BsonIgnore] public bool HasIncidents { get; set; }
}