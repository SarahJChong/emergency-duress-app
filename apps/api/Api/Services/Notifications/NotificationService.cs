using Api.Models;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Options;

namespace Api.Services.Notifications;

/// <summary>
/// Interface for notification service operations.
/// </summary>
public interface INotificationService
{
    /// <summary>Sends a distress notification to all security responders for a specific location.</summary>
    Task SendDistressNotificationAsync(Incident incident, Location location);
}

/// <summary>
/// Service for managing and sending notifications (push and email).
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IEmailNotificationService _emailProvider;
    private readonly EmailNotificationSettings _emailSettings;
    private readonly IRepository<Location> _locationRepository;
    private readonly ILogger<NotificationService> _logger;
    private readonly IEnumerable<IPushNotificationService> _pushProviders;
    private readonly IRepository<User> _userRepository;

    /// <summary>
    /// Initializes a new instance of the NotificationService.
    /// </summary>
    /// <param name="emailProvider">The email notification service provider</param>
    /// <param name="pushProviders">Collection of push notification service providers</param>
    /// <param name="userRepository">Repository for user operations</param>
    /// <param name="locationRepository">Repository for location operations</param>
    /// <param name="logger">Logger for the notification service</param>
    /// <param name="emailSettings">Email notification configuration settings</param>
    public NotificationService(
        IEmailNotificationService emailProvider,
        IEnumerable<IPushNotificationService> pushProviders,
        IRepository<User> userRepository,
        IRepository<Location> locationRepository,
        ILogger<NotificationService> logger,
        IOptions<EmailNotificationSettings> emailSettings)
    {
        _emailProvider = emailProvider;
        _pushProviders = pushProviders;
        _userRepository = userRepository;
        _locationRepository = locationRepository;
        _logger = logger;
        _emailSettings = emailSettings.Value;
    }

    /// <summary>
    /// Sends a distress notification to all security responders for a specific location.
    /// </summary>
    /// <param name="incident">The incident that triggered the notification.</param>
    /// <param name="location">The location where the incident occurred.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public virtual async Task SendDistressNotificationAsync(Incident incident, Location location)
    {
        if (incident.LocationId is null) return;

        try
        {
            // Send email notifications
            await SendEmailNotificationAsync(incident, location);
            _logger.LogInformation("Email notification sent for incident: {Id}", incident.Id);

            await SendPushNotificationAsync(incident, location);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send notifications for incident {Id} at location {LocationId}",
                incident.Id,
                incident.LocationId);
            throw;
        }
    }

    /// <summary>
    /// Sends an email notification about the incident to the location's default email address.
    /// </summary>
    /// <param name="incident">The incident details to include in the email</param>
    /// <param name="location">The location information where the incident occurred</param>
    /// <returns>A task representing the asynchronous operation</returns>
    private async Task SendEmailNotificationAsync(Incident incident, Location location)
    {
        if (string.IsNullOrEmpty(location.DefaultEmail))
        {
            _logger.LogWarning("No default email configured for location: {LocationId}", location.Id);
            return;
        }

        var emailPayload = new EmailNotificationPayload
        {
            IncidentId = incident.Id,
            Location = location.Name,
            // DateCalled = TimeZoneInfo.ConvertTimeFromUtc(incident.DateCalled, TimeZoneInfo.Local),
            DateCalled = TimeZoneInfo.ConvertTimeFromUtc(incident.DateCalled,
                TimeZoneInfo.FindSystemTimeZoneById("W. Australia Standard Time")),
            CallerName = incident.IsAnonymous ? null : incident.Name,
            ContactNumber = incident.IsAnonymous ? null : incident.ContactNumber,
            RoomNumber = incident.RoomNumber,
            Latitude = incident.GpsCoordinates?.Coordinates.Y,
            Longitude = incident.GpsCoordinates?.Coordinates.X,
            IncidentUrl = $"{_emailSettings.WebAppBaseUrl}/security/incidents/{incident.Id}"
        };

        await _emailProvider.SendNotificationAsync(location.DefaultEmail, emailPayload);
    }

    /// <summary>
    /// Sends push notifications about the incident to all security responders' registered devices.
    /// </summary>
    /// <param name="incident">The incident details to include in the notification</param>
    /// <param name="location">The location information where the incident occurred</param>
    /// <returns>A task representing the asynchronous operation</returns>
    private async Task SendPushNotificationAsync(Incident incident, Location location)
    {
        // Get user objects for all security responders assigned to this location
        var securityResponderIds = location.SecurityResponders.Select(sr => sr.Id).ToList();
        var securityResponders = await _userRepository.FindAsync(u =>
            securityResponderIds.Contains(u.Id) && u.DeviceTokens.Any());

        var respondersList = securityResponders.ToList();
        if (!respondersList.Any())
        {
            _logger.LogInformation(
                "No security responders with registered devices found for location: {LocationId}",
                location.Id);
            return;
        }

        var pushPayload = new PushNotificationPayload
        {
            Title = "Duress app alert",
            Body = $"Location: {location.Name}",
            LocationName = location.Name,
            IncidentId = incident.Id,
            WebAppUrl = $"{_emailSettings.WebAppBaseUrl}/security/incidents/{incident.Id}",
            Data = new Dictionary<string, string>
            {
                { "roomNumber", incident.RoomNumber ?? "Not specified" },
                { "isAnonymous", incident.IsAnonymous.ToString() },
                { "dateCalled", incident.DateCalled.ToString("O") }
            }
        };

        var deviceTokens = respondersList
            .SelectMany(r => r.DeviceTokens)
            .ToList();

        var tasks = new List<Task>();
        var exceptions = new List<Exception>();

        foreach (var provider in _pushProviders)
        {
            tasks.Add(provider.SendNotificationAsync(deviceTokens, pushPayload)
                .ContinueWith(t =>
                {
                    if (t.IsFaulted)
                    {
                        _logger.LogError(t.Exception, "Failed to send push notification using {ProviderType}", provider.GetType().Name);
                        exceptions.Add(t.Exception);
                    }
                    else
                    {
                        _logger.LogInformation("Successfully sent push notification using {ProviderType}", provider.GetType().Name);
                    }
                }));
        }

        await Task.WhenAll(tasks);
    }
}