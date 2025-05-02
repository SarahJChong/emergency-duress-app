using System.Linq.Expressions;
using System.Security.Claims;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Api.Services.Notifications;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Driver.GeoJsonObjectModel;
using Moq;

namespace Api.Tests.Controllers;

public class IncidentControllerTests
{
    private const string TestUserId = "65123456789abcdef1234567";
    private const string TestUserExternalId = "auth0|123456";
    private const string TestLocationId = "65123456789abcdef1234568";
    private readonly IncidentController _controller;
    private readonly IRepository<Incident> _incidentRepository;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly IRepository<User> _userRepository;

    public IncidentControllerTests()
    {
        // Setup mock repositories
        _incidentRepository = new MockRepository<Incident>();
        _userRepository = new MockRepository<User>();
        IRepository<Location> locationRepository = new MockRepository<Location>();

        _mockNotificationService = new Mock<INotificationService>();


        // Create controller
        _controller = new IncidentController(_incidentRepository, _userRepository, locationRepository,
            _mockNotificationService.Object);

        // Setup test user
        var user = new User
        {
            Id = TestUserId,
            ExternalId = TestUserExternalId,
            Name = "Test User",
            Email = "test@example.com",
            ContactNumber = "+61412345678",
            LocationId = TestLocationId,
            RoomNumber = "101A",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Roles = []
        };
        _userRepository.AddAsync(user).Wait();

        // Setup test location
        var location = new Location
        {
            Id = TestLocationId,
            Name = "Test Location",
            DefaultPhoneNumber = "+61412345678",
            DefaultEmail = "location@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        locationRepository.AddAsync(location).Wait();

        // Setup ClaimsPrincipal
        var claims = new[]
        {
            new Claim("sub", TestUserExternalId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        // Setup controller context
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
    }

    [Fact]
    public async Task CreateIncident_ValidRequest_Returns201Created()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = TestLocationId,
            RoomNumber = "102B",
            Latitude = -33.8688,
            Longitude = 151.2093
        };

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(StatusCodes.Status201Created, createdResult.StatusCode);

        // Verify notification was sent
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(
                It.Is<Incident>(i => i.LocationId == TestLocationId),
                It.Is<Location>(l => l.Id == TestLocationId)),
            Times.Once,
            "Notification should be sent for new incidents");

        var response = createdResult.Value;
        Assert.NotNull(response);
        Assert.Equal("Open", response.GetType().GetProperty("status")?.GetValue(response)?.ToString());
        Assert.Equal(false, response.GetType().GetProperty("isAnonymous")?.GetValue(response));
    }

    [Fact]
    public async Task CreateIncident_AnonymousRequest_Returns201Created()
    {
        // Arrange
        var request = new CreateIncidentRequest
        {
            LocationId = TestLocationId,
            RoomNumber = "102B",
            Latitude = -33.8688,
            Longitude = 151.2093,
            IsAnonymous = true
        };

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(StatusCodes.Status201Created, createdResult.StatusCode);

        var response = createdResult.Value;
        Assert.NotNull(response);
        Assert.Equal("Open", response.GetType().GetProperty("status")?.GetValue(response)?.ToString());
        Assert.Equal(true, response.GetType().GetProperty("isAnonymous")?.GetValue(response));

        // Verify notification was sent even for anonymous incidents
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(
                It.Is<Incident>(i => i.IsAnonymous && i.LocationId == TestLocationId),
                It.Is<Location>(l => l.Id == TestLocationId)),
            Times.Once,
            "Notification should be sent for anonymous incidents");

        // Get the created incident from the repository to verify PII fields are null
        var incidents = await _incidentRepository.FindAsync(i => i.Status == IncidentStatus.Open);
        var incident = incidents.FirstOrDefault(i => i.IsAnonymous);
        Assert.NotNull(incident);
        Assert.Null(incident.Name);
        Assert.Null(incident.ContactNumber);
        Assert.Null(incident.RoomNumber);
        Assert.Equal(TestUserId, incident.UserId); // User ID should be stored even for anonymous incidents
        Assert.Equal(TestLocationId,
            incident.LocationId); // Location ID should be stored even for anonymous incidents
        Assert.NotNull(incident.GpsCoordinates); // GPS coordinates should still be included
    }

    [Fact]
    public async Task CreateIncident_NoAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
        var request = new CreateIncidentRequest
        {
            LocationId = TestLocationId
        };

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);

        // Verify no notification was sent
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(It.IsAny<Incident>(), It.IsAny<Location>()),
            Times.Never,
            "Notification should not be sent when unauthorized");
    }

    [Fact]
    public async Task CreateIncident_UserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("sub", "unknown_user")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);

        var request = new CreateIncidentRequest
        {
            LocationId = TestLocationId
        };

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("User not authenticated.", unauthorizedResult.Value);

        // Verify no notification was sent
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(It.IsAny<Incident>(), It.IsAny<Location>()),
            Times.Never,
            "Notification should not be sent when user is not found");
    }

    [Fact]
    public async Task CreateIncident_HasActiveIncident_ReturnsBadRequest()
    {
        // Arrange
        var existingIncident = new Incident
        {
            Id = "test-incident",
            Status = IncidentStatus.Open,
            UserId = TestUserId,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _incidentRepository.AddAsync(existingIncident);

        var request = new CreateIncidentRequest
        {
            LocationId = TestLocationId
        };

        // Act
        var result = await _controller.CreateIncident(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User already has an active incident.", badRequestResult.Value);

        // Verify no notification was sent
        _mockNotificationService.Verify(
            x => x.SendDistressNotificationAsync(It.IsAny<Incident>(), It.IsAny<Location>()),
            Times.Never,
            "Notification should not be sent when user has active incident");
    }

    [Fact]
    public async Task GetActiveIncident_NoActiveIncident_Returns404()
    {
        // Act
        var result = await _controller.GetActiveIncident();

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetActiveIncident_HasClosedIncident_Returns404()
    {
        // Arrange
        var incident = new Incident
        {
            Id = "test-incident",
            Status = IncidentStatus.Closed,
            UserId = TestUserId,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _incidentRepository.AddAsync(incident);

        // Act
        var result = await _controller.GetActiveIncident();

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetActiveIncident_HasActiveIncident_ReturnsIncident()
    {
        // Arrange
        var incident = new Incident
        {
            Id = "test-incident",
            Status = IncidentStatus.Open,
            UserId = TestUserId,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _incidentRepository.AddAsync(incident);

        // Act
        var result = await _controller.GetActiveIncident();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var activeIncident = Assert.IsType<Incident>(okResult.Value);
        Assert.Equal("test-incident", activeIncident.Id);
        Assert.Equal(IncidentStatus.Open, activeIncident.Status);
    }

    [Fact]
    public async Task GetActiveIncident_NoAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetActiveIncident();

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task CancelIncident_NoActiveIncident_Returns404()
    {
        // Arrange
        var request = new CancelIncidentRequest
        {
            CancellationReason = "Test reason"
        };

        // Act
        var result = await _controller.CancelIncident(request);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task CancelIncident_NoAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
        var request = new CancelIncidentRequest
        {
            CancellationReason = "Test reason"
        };

        // Act
        var result = await _controller.CancelIncident(request);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task CancelIncident_MissingReason_ReturnsBadRequest()
    {
        // Arrange
        var incident = new Incident
        {
            Id = "test-incident",
            Status = IncidentStatus.Open,
            UserId = TestUserId,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _incidentRepository.AddAsync(incident);

        var request = new CancelIncidentRequest
        {
            CancellationReason = string.Empty
        };

        // Act
        var result = await _controller.CancelIncident(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Cancellation reason is required.", badRequestResult.Value);
    }

    [Fact]
    public async Task CancelIncident_ValidRequest_ReturnsCancelledIncident()
    {
        // Arrange
        // First, verify the test user exists and get their ID
        var user = await _userRepository.FindUniqueAsync(u => u.ExternalId == TestUserExternalId);
        Assert.NotNull(user);
        Assert.Equal(TestUserId, user.Id);

        // Create an incident with the user's ID
        var incident = new Incident
        {
            Id = "test-incident",
            Status = IncidentStatus.Open,
            UserId = user.Id, // Ensure we're using the same user ID that the controller will find
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _incidentRepository.AddAsync(incident);

        // Verify the incident was added and can be found by user ID
        var incidents =
            await _incidentRepository.FindAsync(i => i.UserId == user.Id && i.Status == IncidentStatus.Open);
        var activeIncident = incidents.FirstOrDefault();
        Assert.NotNull(activeIncident);
        Assert.Equal("test-incident", activeIncident.Id);

        var request = new CancelIncidentRequest
        {
            CancellationReason = "Test cancellation"
        };

        // Act
        var result = await _controller.CancelIncident(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var cancelledIncident = Assert.IsType<Incident>(okResult.Value);
        Assert.Equal(IncidentStatus.Cancelled, cancelledIncident.Status);
        Assert.Equal("Test cancellation", cancelledIncident.CancellationReason);
        Assert.NotNull(cancelledIncident.DateClosed);
    }

    [Fact]
    public async Task GetUserIncidents_NoIncidents_ReturnsEmptyList()
    {
        // Act
        var result = await _controller.GetUserIncidents();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var incidents = Assert.IsAssignableFrom<IEnumerable<Incident>>(okResult.Value);
        Assert.Empty(incidents);
    }

    [Fact]
    public async Task GetUserIncidents_HasIncidents_ReturnsIncidentsList()
    {
        // Arrange
        var user = await _userRepository.FindUniqueAsync(u => u.ExternalId == TestUserExternalId);
        Assert.NotNull(user);

        // Create multiple incidents for the user with different statuses and dates
        var incident1 = new Incident
        {
            Id = "test-incident-1",
            Status = IncidentStatus.Open,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        await _incidentRepository.AddAsync(incident1);

        var incident2 = new Incident
        {
            Id = "test-incident-2",
            Status = IncidentStatus.Closed,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-2),
            DateClosed = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        await _incidentRepository.AddAsync(incident2);

        var incident3 = new Incident
        {
            Id = "test-incident-3",
            Status = IncidentStatus.Cancelled,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-3),
            DateClosed = DateTime.UtcNow.AddDays(-3),
            CancellationReason = "Test reason",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            UpdatedAt = DateTime.UtcNow.AddDays(-3)
        };
        await _incidentRepository.AddAsync(incident3);

        // Act
        var result = await _controller.GetUserIncidents();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var incidents = Assert.IsAssignableFrom<IEnumerable<Incident>>(okResult.Value);
        var enumerable = incidents.ToList();
        Assert.Equal(3, enumerable.Count());

        // Verify incidents are sorted by date (newest first)
        var incidentsList = enumerable.ToList();

        Assert.Equal("test-incident-1", incidentsList[0].Id);
        Assert.Equal("test-incident-2", incidentsList[1].Id);
        Assert.Equal("test-incident-3", incidentsList[2].Id);
    }

    [Fact]
    public async Task GetUserIncidents_RegularUser_FiltersByDateAndOpenStatus()
    {
        // Arrange
        var user = await _userRepository.FindUniqueAsync(u => u.ExternalId == TestUserExternalId);
        Assert.NotNull(user);

        // Create incidents with various dates and statuses
        var recentOpenIncident = new Incident
        {
            Id = "recent-open",
            Status = IncidentStatus.Open,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-5),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };
        await _incidentRepository.AddAsync(recentOpenIncident);

        var oldOpenIncident = new Incident
        {
            Id = "old-open",
            Status = IncidentStatus.Open,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow.AddDays(-60),
            UpdatedAt = DateTime.UtcNow.AddDays(-60)
        };
        await _incidentRepository.AddAsync(oldOpenIncident);

        var recentClosedIncident = new Incident
        {
            Id = "recent-closed",
            Status = IncidentStatus.Closed,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-15),
            DateClosed = DateTime.UtcNow.AddDays(-14),
            CreatedAt = DateTime.UtcNow.AddDays(-15),
            UpdatedAt = DateTime.UtcNow.AddDays(-14)
        };
        await _incidentRepository.AddAsync(recentClosedIncident);

        var oldClosedIncident = new Incident
        {
            Id = "old-closed",
            Status = IncidentStatus.Closed,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-45),
            DateClosed = DateTime.UtcNow.AddDays(-44),
            CreatedAt = DateTime.UtcNow.AddDays(-45),
            UpdatedAt = DateTime.UtcNow.AddDays(-44)
        };
        await _incidentRepository.AddAsync(oldClosedIncident);

        // Act
        var result = await _controller.GetUserIncidents();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var incidents = Assert.IsAssignableFrom<IEnumerable<IncidentDetailsResponse>>(okResult.Value);
        var incidentsList = incidents.ToList();

        // Should include: recent-open (because it's open), old-open (because it's open), recent-closed (within 30 days)
        // Should exclude: old-closed (older than 30 days and not open)
        Assert.Equal(3, incidentsList.Count);
        Assert.Contains(incidentsList, i => i.Id == "recent-open");
        Assert.Contains(incidentsList, i => i.Id == "old-open");
        Assert.Contains(incidentsList, i => i.Id == "recent-closed");
        Assert.DoesNotContain(incidentsList, i => i.Id == "old-closed");
    }

    [Fact]
    public async Task GetUserIncidents_NoAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetUserIncidents();

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task GetIncidentDetails_IncidentExists_ReturnsIncident()
    {
        // Arrange
        var user = await _userRepository.FindUniqueAsync(u => u.ExternalId == TestUserExternalId);
        Assert.NotNull(user);

        var incident = new Incident
        {
            Id = "test-incident-details",
            Status = IncidentStatus.Closed,
            UserId = user.Id,
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-2),
            DateClosed = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        await _incidentRepository.AddAsync(incident);

        // Act
        var result = await _controller.GetIncidentDetails("test-incident-details");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedIncident = Assert.IsType<IncidentDetailsResponse>(okResult.Value);
        Assert.Equal("test-incident-details", returnedIncident.Id);
        Assert.Equal(IncidentStatus.Closed, returnedIncident.Status);
        Assert.NotNull(returnedIncident.Location);
        Assert.Equal("Test Location", returnedIncident.Location.Name);
    }

    [Fact]
    public async Task GetIncidentDetails_IncidentDoesNotExist_Returns404()
    {
        // Act
        var result = await _controller.GetIncidentDetails("non-existent-id");

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetIncidentDetails_NoAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetIncidentDetails("any-id");

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task GetIncidentDetails_UnauthorizedAccess_ReturnsForbid()
    {
        // Arrange
        // Create a different user
        var otherUser = new User
        {
            Id = "other-user-id",
            ExternalId = "auth0|other",
            Name = "Other User",
            Email = "other@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Roles = []
        };
        await _userRepository.AddAsync(otherUser);

        // Create an incident owned by the other user
        var incident = new Incident
        {
            Id = "other-user-incident",
            Status = IncidentStatus.Closed,
            UserId = "other-user-id",
            LocationId = TestLocationId,
            DateCalled = DateTime.UtcNow.AddDays(-2),
            DateClosed = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            IsAnonymous = false
        };
        await _incidentRepository.AddAsync(incident);

        // Act
        var result = await _controller.GetIncidentDetails("other-user-incident");

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetIncidentDetails_AnonymousIncident_ReturnsIncident()
    {
        // Arrange
        // Create an anonymous incident
        var incident = new Incident
        {
            Id = "anonymous-incident",
            Status = IncidentStatus.Closed,
            UserId = TestUserId, // Anonymous incidents should have the user ID set
            LocationId = TestLocationId, // Location ID should be included for anonymous incidents
            DateCalled = DateTime.UtcNow.AddDays(-2),
            DateClosed = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            IsAnonymous = true
        };
        await _incidentRepository.AddAsync(incident);

        // Act
        var result = await _controller.GetIncidentDetails("anonymous-incident");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedIncident = Assert.IsType<IncidentDetailsResponse>(okResult.Value);
        Assert.Equal("anonymous-incident", returnedIncident.Id);
        Assert.True(returnedIncident.IsAnonymous);
        Assert.NotNull(returnedIncident.Location);
        Assert.Equal("Test Location", returnedIncident.Location.Name);
    }
}

// Simple in-memory repository implementation for testing
public class MockRepository<T> : IRepository<T> where T : class
{
    private readonly Dictionary<string, T> _items = new();

    public Task<T?> GetByIdAsync(string id)
    {
        _items.TryGetValue(id, out var item);
        return Task.FromResult(item);
    }

    public Task<IEnumerable<T>> GetAllAsync()
    {
        return Task.FromResult(_items.Values.AsEnumerable());
    }

    public Task<T?> FindUniqueAsync(Expression<Func<T, bool>> predicate)
    {
        var compiled = predicate.Compile();
        return Task.FromResult(_items.Values.FirstOrDefault(compiled));
    }

    public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        var compiled = predicate.Compile();
        return Task.FromResult(_items.Values.Where(compiled));
    }

    public Task<T> AddAsync(T entity)
    {
        var prop = typeof(T).GetProperty("Id");
        var id = (string)prop?.GetValue(entity)!;

        // If the ID is empty or null, generate a new one
        if (string.IsNullOrEmpty(id))
        {
            id = Guid.NewGuid().ToString();
            prop?.SetValue(entity, id);
        }

        _items[id] = entity;
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(string id, T entity)
    {
        _items[id] = entity;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id)
    {
        _items.Remove(id);
        return Task.CompletedTask;
    }

    public Task<long> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        if (predicate == null)
            return Task.FromResult((long)_items.Count);

        var compiled = predicate.Compile();
        return Task.FromResult((long)_items.Values.Count(compiled));
    }

    public Task<IEnumerable<TResult>> AggregateAsync<TResult>(PipelineDefinition<T, TResult> pipeline)
    {
        throw new NotImplementedException();
    }
}