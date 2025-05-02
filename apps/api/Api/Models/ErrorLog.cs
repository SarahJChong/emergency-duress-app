using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Api.Models;

/// <summary>
///     Represents an error log entry from the client application
/// </summary>
public class ErrorLog
{
    /// <summary>
    ///     Unique identifier for the error log
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    ///     Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    ///     Stack trace of the error
    /// </summary>
    public string? Stack { get; set; }

    /// <summary>
    ///     When the error occurred
    /// </summary>
    public DateTimeOffset Timestamp { get; set; }

    /// <summary>
    ///     Additional context information about the error
    /// </summary>
    public Dictionary<string, object>? Context { get; set; }

    /// <summary>
    ///     Information about the device where the error occurred
    /// </summary>
    public ErrorLogDeviceInfo DeviceInfo { get; set; } = new();
}

/// <summary>
///     Information about the device where an error occurred
/// </summary>
public class ErrorLogDeviceInfo
{
    /// <summary>
    ///     Platform (e.g., iOS, Android)
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    ///     Version of the platform
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    ///     Device manufacturer
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    ///     Device model
    /// </summary>
    public string? Model { get; set; }
}