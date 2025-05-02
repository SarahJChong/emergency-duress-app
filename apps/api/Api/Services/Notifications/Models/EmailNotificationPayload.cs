namespace Api.Services.Notifications.Models;

/// <summary>
/// Represents the payload for an email notification about an incident.
/// </summary>
public class EmailNotificationPayload
{
    /// <summary>
    /// Gets or sets the incident identifier.
    /// </summary>
    public string IncidentId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the location where the incident occurred.
    /// </summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date and time when the incident was reported.
    /// </summary>
    public DateTime DateCalled { get; set; }

    /// <summary>
    /// Gets or sets the name of the person who reported the incident.
    /// Null if the incident was reported anonymously.
    /// </summary>
    public string? CallerName { get; set; }

    /// <summary>
    /// Gets or sets the contact number of the person who reported the incident.
    /// Null if the incident was reported anonymously or no number was provided.
    /// </summary>
    public string? ContactNumber { get; set; }

    /// <summary>
    /// Gets or sets the room number where the incident occurred.
    /// </summary>
    public string? RoomNumber { get; set; }

    /// <summary>
    /// Gets or sets the GPS latitude of the incident location.
    /// </summary>
    public double? Latitude { get; set; }

    /// <summary>
    /// Gets or sets the GPS longitude of the incident location.
    /// </summary>
    public double? Longitude { get; set; }

    /// <summary>
    /// Gets or sets the URL to view the incident details in the web application.
    /// </summary>
    public string IncidentUrl { get; set; } = string.Empty;
}