using System.Linq.Expressions;
using Api.Models;
using Api.Services;
using Api.Services.Notifications;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using Moq;

namespace Api.Tests.Services;

public class NotificationServiceTests
{
    private readonly Mock<IEmailNotificationService> _mockEmailProvider;
    private readonly Mock<IPushNotificationService> _mockExpoPushProvider;
    private readonly Mock<IPushNotificationService> _mockWebPushProvider;
    private readonly Mock<IRepository<User>> _mockUserRepository;
    private readonly Mock<IRepository<Location>> _mockLocationRepository;
    private readonly Mock<ILogger<NotificationService>> _mockLogger;
    private readonly EmailNotificationSettings _emailSettings;
    private readonly Location _testLocation;
    private readonly Incident _testIncident;

    public NotificationServiceTests()
    {
        _mockEmailProvider = new Mock<IEmailNotificationService>();
        _mockExpoPushProvider = new Mock<IPushNotificationService>();
        _mockWebPushProvider = new Mock<IPushNotificationService>();
        _mockUserRepository = new Mock<IRepository<User>>();
        _mockLocationRepository = new Mock<IRepository<Location>>();
        _mockLogger = new Mock<ILogger<NotificationService>>();

        _emailSettings = new EmailNotificationSettings
        {
            WebAppBaseUrl = "https://test.example.com"
        };

        var now = DateTime.UtcNow;
        _testLocation = new Location
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "Test Location",
            DefaultEmail = "security@test.com",
            DefaultPhoneNumber = "1234567890",
            SecurityResponders = new List<SecurityResponder>(),
            CreatedAt = now,
            UpdatedAt = now
        };

        _testIncident = new Incident
        {
            Id = ObjectId.GenerateNewId().ToString(),
            LocationId = _testLocation.Id,
            DateCalled = now,
            Name = "Test User",
            ContactNumber = "1234567890",
            IsAnonymous = false
        };
    }

    [Fact]
    public async Task SendDistressNotificationAsync_SendsEmailAndPushNotifications()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var securityResponders = new List<User>
        {
            new()
            {
                Id = ObjectId.GenerateNewId().ToString(),
                ExternalId = "ext1",
                Name = "Security 1",
                Email = "security1@test.com",
                Roles = new List<string> { "security" },
                LocationId = _testLocation.Id,
                DeviceTokens = new List<string> { "token1" },
                CreatedAt = now,
                UpdatedAt = now
            },
            new()
            {
                Id = ObjectId.GenerateNewId().ToString(),
                ExternalId = "ext2",
                Name = "Security 2",
                Email = "security2@test.com",
                Roles = new List<string> { "security" },
                LocationId = _testLocation.Id,
                DeviceTokens = new List<string> { "token2" },
                CreatedAt = now,
                UpdatedAt = now
            }
        };

        _mockUserRepository
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(securityResponders);

        var service = CreateService();

        // Act
        await service.SendDistressNotificationAsync(_testIncident, _testLocation);

        // Assert
        _mockEmailProvider.Verify(
            x => x.SendNotificationAsync(
                It.Is<string>(email => email == _testLocation.DefaultEmail),
                It.Is<EmailNotificationPayload>(p =>
                    p.IncidentId == _testIncident.Id &&
                    p.Location == _testLocation.Name)),
            Times.Once);

        _mockExpoPushProvider.Verify(
            x => x.SendNotificationAsync(
                It.Is<IEnumerable<string>>(tokens =>
                    tokens.Count() == 2 &&
                    tokens.Contains("token1") &&
                    tokens.Contains("token2")),
                It.Is<PushNotificationPayload>(p =>
                    p.Title == "Duress app alert" &&
                    p.LocationName == _testLocation.Name &&
                    p.IncidentId == _testIncident.Id)),
            Times.Once);

        _mockWebPushProvider.Verify(
            x => x.SendNotificationAsync(
                It.Is<IEnumerable<string>>(tokens =>
                    tokens.Count() == 2 &&
                    tokens.Contains("token1") &&
                    tokens.Contains("token2")),
                It.Is<PushNotificationPayload>(p =>
                    p.Title == "Duress app alert" &&
                    p.LocationName == _testLocation.Name &&
                    p.IncidentId == _testIncident.Id)),
            Times.Once);
    }

    [Fact]
    public async Task SendDistressNotificationAsync_NoSecurityResponders_OnlySendsEmail()
    {
        // Arrange
        _mockUserRepository
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(new List<User>());

        var service = CreateService();

        // Act
        await service.SendDistressNotificationAsync(_testIncident, _testLocation);

        // Assert
        _mockEmailProvider.Verify(
            x => x.SendNotificationAsync(
                It.IsAny<string>(),
                It.IsAny<EmailNotificationPayload>()),
            Times.Once);

        _mockExpoPushProvider.Verify(
            x => x.SendNotificationAsync(
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<PushNotificationPayload>()),
            Times.Never);

        _mockWebPushProvider.Verify(
            x => x.SendNotificationAsync(
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<PushNotificationPayload>()),
            Times.Never);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("No security responders")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    private NotificationService CreateService()
    {
        var mockEmailSettings = new Mock<IOptions<EmailNotificationSettings>>();
        mockEmailSettings.Setup(x => x.Value).Returns(_emailSettings);

        var pushProviders = new List<IPushNotificationService> {
            _mockExpoPushProvider.Object,
            _mockWebPushProvider.Object
        };

        return new NotificationService(
            _mockEmailProvider.Object,
            pushProviders,
            _mockUserRepository.Object,
            _mockLocationRepository.Object,
            _mockLogger.Object,
            mockEmailSettings.Object);
    }
}