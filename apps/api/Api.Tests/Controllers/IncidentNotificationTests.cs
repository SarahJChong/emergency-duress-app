using System.Linq.Expressions;
using System.Security.Claims;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Api.Services.Notifications;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Controllers;

public class IncidentNotificationTests
{
    private readonly IncidentController _controller;
    private readonly Mock<IRepository<Incident>> _mockIncidentRepo;
    private readonly Mock<IRepository<Location>> _mockLocationRepo;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Location _testLocation;
    private readonly User _testUser;

    public IncidentNotificationTests()
    {
        _mockIncidentRepo = new Mock<IRepository<Incident>>();
        Mock<IRepository<User>> mockUserRepo = new();
        _mockLocationRepo = new Mock<IRepository<Location>>();

        _mockNotificationService = new Mock<INotificationService>();

        _testUser = new User
        {
            Id = "test-user-id",
            ExternalId = "test-external-id",
            Name = "Test User",
            Email = "",
            Roles = [],
            CreatedAt = default,
            UpdatedAt = default
        };

        _testLocation = new Location
        {
            Id = "test-location-id",
            Name = "Test Location",
            DefaultPhoneNumber = "",
            DefaultEmail = ""
        };

        _controller = new IncidentController(
            _mockIncidentRepo.Object,
            mockUserRepo.Object,
            _mockLocationRepo.Object,
            _mockNotificationService.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, _testUser.ExternalId)
                    }))
                }
            }
        };

        // Setup common repository responses
        mockUserRepo.Setup(repo => repo.FindUniqueAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(_testUser);

        _mockLocationRepo.Setup(x => x.GetByIdAsync(_testLocation.Id))
            .ReturnsAsync(_testLocation);
    }

    [Fact]
    public async Task CreateIncident_WhenSuccessful_SendsNotification()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = _testLocation.Id
        };

        var createdIncident = new Incident
        {
            Id = "test-incident-id",
            LocationId = _testLocation.Id,
            UserId = _testUser.Id
        };

        _mockIncidentRepo.Setup(x => x.AddAsync(It.IsAny<Incident>()))
            .ReturnsAsync(createdIncident);

        // Act
        await _controller.CreateIncident(request);

        // Assert
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(
                It.Is<Incident>(i => i.Id == createdIncident.Id),
                It.Is<Location>(l => l.Id == _testLocation.Id)),
            Times.Once);
    }

    [Fact]
    public async Task CreateIncident_WhenNotificationFails_StillReturnsSuccessfulResult()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = _testLocation.Id
        };

        var createdIncident = new Incident
        {
            Id = "test-incident-id",
            LocationId = _testLocation.Id,
            UserId = _testUser.Id
        };

        _mockIncidentRepo.Setup(x => x.AddAsync(It.IsAny<Incident>()))
            .ReturnsAsync(createdIncident);

        _mockNotificationService
            .Setup(x => x.SendDistressNotificationAsync(
                It.IsAny<Incident>(),
                It.IsAny<Location>()))
            .ThrowsAsync(new Exception("Failed to send notification"));

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        var actionResult = Assert.IsType<CreatedAtActionResult>(result);
        var value = actionResult.Value;
        Assert.NotNull(value);
        Assert.Equal(createdIncident.Id, value.GetType().GetProperty("id")?.GetValue(value));
    }

    [Fact]
    public async Task CreateIncident_WhenLocationNotFound_DoesNotSendNotification()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = "non-existent-location"
        };

        _mockLocationRepo.Setup(x => x.GetByIdAsync(request.LocationId))
            .ReturnsAsync((Location?)null);

        var createdIncident = new Incident
        {
            Id = "test-incident-id",
            LocationId = request.LocationId,
            UserId = _testUser.Id
        };

        _mockIncidentRepo.Setup(x => x.AddAsync(It.IsAny<Incident>()))
            .ReturnsAsync(createdIncident);

        // Act
        await _controller.CreateIncident(request);

        // Assert
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(
                It.IsAny<Incident>(),
                It.IsAny<Location>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateIncident_WhenUserHasActiveIncident_DoesNotSendNotification()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = _testLocation.Id
        };

        var activeIncident = new Incident
        {
            Id = "active-incident-id",
            UserId = _testUser.Id,
            Status = IncidentStatus.Open,
            LocationId = ""
        };

        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync([activeIncident]);

        // Act
        await _controller.CreateIncident(request);

        // Assert
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(
                It.IsAny<Incident>(),
                It.IsAny<Location>()),
            Times.Never);
    }
}