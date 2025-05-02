using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Api.Models;

/// <summary>
/// Represents a user (village resident) profile in the system.
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user in the database
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public required string Id { get; set; }

    /// <summary>
    /// External identity from the authentication provider
    /// </summary>
    [BsonElement("externalId")] public required string ExternalId { get; set; }

    /// <summary>
    /// Full name of the user
    /// </summary>
    [BsonElement("name")] public required string Name { get; set; }

    /// <summary>
    /// Email address of the user
    /// </summary>
    [BsonElement("email")] public required string Email { get; set; }

    /// <summary>
    /// Contact phone number for the user
    /// </summary>
    [BsonElement("contactNumber")] public string? ContactNumber { get; set; }

    /// <summary>
    /// Reference to the user's selected location (Foreign Key to Locations._id)
    /// </summary>
    [BsonElement("locationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? LocationId { get; set; }

    /// <summary>
    /// Room number at the user's location
    /// </summary>
    [BsonElement("roomNumber")] public string? RoomNumber { get; set; }

    /// <summary>
    /// List of Expo push notification tokens for the user's devices
    /// </summary>
    [BsonElement("deviceTokens")]
    public List<string> DeviceTokens { get; set; } = new();

    /// <summary>
    /// Roles assigned to the user, synchronized from the identity provider
    /// </summary>
    [BsonElement("roles")]
    public required List<string> Roles { get; set; } = new();

    /// <summary>
    /// When the user profile was created
    /// </summary>
    [BsonElement("createdAt")] public required DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the user profile was last updated
    /// </summary>
    [BsonElement("updatedAt")] public required DateTime UpdatedAt { get; set; }
}