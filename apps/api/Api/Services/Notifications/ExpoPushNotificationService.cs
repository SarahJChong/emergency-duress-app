using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Api.Services.Notifications;

/// <summary>
/// Implements push notification service using Expo's Push API.
/// </summary>
public class ExpoPushNotificationService : IPushNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushNotificationService> _logger;
    private readonly ExpoPushSettings _settings;
    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>
    /// Initializes a new instance of the <see cref="ExpoPushNotificationService"/> class.
    /// </summary>
    /// <param name="httpClient">The HTTP client for making requests to Expo's Push API</param>
    /// <param name="settings">Configuration settings for the Expo Push service</param>
    /// <param name="logger">Logger for the Expo Push notification service</param>
    public ExpoPushNotificationService(
        HttpClient httpClient,
        IOptions<ExpoPushSettings> settings,
        ILogger<ExpoPushNotificationService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        _httpClient.BaseAddress = new Uri(_settings.ApiUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

        if (!string.IsNullOrEmpty(_settings.AccessToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _settings.AccessToken);
        }

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    /// <inheritdoc/>
    public async Task SendNotificationAsync(string deviceToken, PushNotificationPayload payload)
    {
        try
        {
            var message = CreateExpoPushMessage(deviceToken, payload);
            await SendToExpoAsync(new[] { message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notification to device {DeviceToken}", deviceToken);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task SendNotificationAsync(IEnumerable<string> deviceTokens, PushNotificationPayload payload)
    {
        try
        {
            var messages = deviceTokens.Select(token => CreateExpoPushMessage(token, payload));
            await SendToExpoAsync(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notifications to {Count} devices", deviceTokens.Count());
            throw;
        }
    }

    /// <summary>
    /// Creates an Expo push message from the notification payload
    /// </summary>
    /// <param name="to">The device token to send the notification to</param>
    /// <param name="payload">The notification payload containing the message content</param>
    /// <returns>An Expo push message ready to be sent</returns>
    private ExpoPushMessage CreateExpoPushMessage(string to, PushNotificationPayload payload)
    {
        return new ExpoPushMessage
        {
            To = to,
            Title = payload.Title,
            Body = payload.Body,
            Data = new Dictionary<string, string>
            {
                { "incidentId", payload.IncidentId },
                { "webAppUrl", payload.WebAppUrl },
                { "locationName", payload.LocationName }
            }.Concat(payload.Data).ToDictionary(x => x.Key, x => x.Value),
            Sound = "default",
            Priority = "high"
        };
    }

    /// <summary>
    /// Sends push messages to Expo's Push API
    /// </summary>
    /// <param name="messages">Collection of Expo push messages to send</param>
    /// <returns>A task representing the asynchronous operation</returns>
    /// <exception cref="HttpRequestException">Thrown when the API request fails</exception>
    private async Task SendToExpoAsync(IEnumerable<ExpoPushMessage> messages)
    {
        var content = new StringContent(
            JsonSerializer.Serialize(new { messages }, _jsonOptions),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.PostAsync("", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Expo push notification failed with status {Status}: {Body}",
                response.StatusCode, responseBody);
            throw new HttpRequestException(
                $"Expo push notification failed with status {response.StatusCode}");
        }

        _logger.LogInformation("Successfully sent {Count} push notifications", messages.Count());
    }

    /// <summary>
    /// Represents a message format compatible with Expo's Push API
    /// </summary>
    private class ExpoPushMessage
    {
        /// <summary>The device token to send the notification to</summary>
        public string To { get; set; } = string.Empty;

        /// <summary>The notification title</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>The notification body text</summary>
        public string Body { get; set; } = string.Empty;

        /// <summary>Additional data to send with the notification</summary>
        public Dictionary<string, string> Data { get; set; } = new();

        /// <summary>The notification sound to play</summary>
        public string Sound { get; set; } = string.Empty;

        /// <summary>The notification priority level</summary>
        public string Priority { get; set; } = string.Empty;
    }
}