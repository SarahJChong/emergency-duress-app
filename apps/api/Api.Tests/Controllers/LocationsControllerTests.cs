using System.Linq.Expressions;
using System.Security.Claims;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Controllers;

public class LocationsControllerTests
{
    private readonly LocationsController _controller;
    private readonly Mock<IRepository<Incident>> _mockIncidentRepo;
    private readonly Mock<IRepository<Location>> _mockLocationRepo;

    public LocationsControllerTests()
    {
        _mockLocationRepo = new Mock<IRepository<Location>>();
        _mockIncidentRepo = new Mock<IRepository<Incident>>();
        Mock<IRepository<User>> mockUserRepo = new();
        _controller = new LocationsController(_mockLocationRepo.Object, _mockIncidentRepo.Object, mockUserRepo.Object);

        // Set up default claims for admin user
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
    }

    private void SetupNonAdminUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "User")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext.HttpContext.User = claimsPrincipal;
    }

    [Fact]
    public async Task GetLocations_AsAdmin_ReturnsAllLocationsWithIncidentFlags()
    {
        // Arrange
        var locations = new List<Location>
        {
            new() { Id = "1", Name = "Location 1", DefaultPhoneNumber = "123", DefaultEmail = "test1@test.com" },
            new() { Id = "2", Name = "Location 2", DefaultPhoneNumber = "456", DefaultEmail = "test2@test.com" }
        };
        _mockLocationRepo.Setup(repo => repo.GetAllAsync()).ReturnsAsync(locations);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>());

        // Act
        var result = await _controller.GetLocations();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLocations = Assert.IsAssignableFrom<IEnumerable<Location>>(okResult.Value);
        var returnedLocationList = returnedLocations.ToList();
        Assert.Equal(2, returnedLocationList.Count());
        Assert.All(returnedLocationList, loc => Assert.False(loc.HasIncidents));
    }

    [Fact]
    public async Task GetLocations_AsNonAdmin_ReturnsLocationsWithoutIncidentFlags()
    {
        // Arrange
        SetupNonAdminUser();
        var locations = new List<Location>
        {
            new() { Id = "1", Name = "Location 1", DefaultPhoneNumber = "123", DefaultEmail = "test1@test.com" },
            new() { Id = "2", Name = "Location 2", DefaultPhoneNumber = "456", DefaultEmail = "test2@test.com" }
        };
        _mockLocationRepo.Setup(repo => repo.GetAllAsync()).ReturnsAsync(locations);

        // Act
        var result = await _controller.GetLocations();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLocations = Assert.IsAssignableFrom<IEnumerable<Location>>(okResult.Value);
        var enumerable = returnedLocations.ToList();
        Assert.Equal(2, enumerable.Count());
        // Non-admin users shouldn't see the hasIncidents flag
        Assert.All(enumerable, loc => Assert.False(loc.HasIncidents));
    }

    [Fact]
    public async Task CreateLocation_WithValidData_ReturnsCreatedResult()
    {
        // Arrange
        var locationRequest = new LocationRequest(
            "New Location",
            "123",
            "test@test.com"
        );
        var createdLocation = new Location
        {
            Id = "1",
            Name = locationRequest.Name,
            DefaultPhoneNumber = locationRequest.DefaultPhoneNumber,
            DefaultEmail = locationRequest.DefaultEmail
        };

        _mockLocationRepo.Setup(repo => repo.FindUniqueAsync(It.IsAny<Expression<Func<Location, bool>>>()))
            .ReturnsAsync((Location?)null);
        _mockLocationRepo.Setup(repo => repo.AddAsync(It.IsAny<Location>()))
            .ReturnsAsync(createdLocation);

        // Act
        var result = await _controller.CreateLocation(locationRequest);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(createdLocation.Id, (createdResult.Value as Location)?.Id);
    }

    [Fact]
    public async Task UpdateLocation_WithNoIncidents_ReturnsOkResult()
    {
        // Arrange
        var existingLocation = new Location
        {
            Id = "1",
            Name = "Original Name",
            DefaultPhoneNumber = "123",
            DefaultEmail = "test@test.com",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var updateRequest = new LocationRequest(
            "Updated Name",
            "456",
            "updated@test.com"
        );

        _mockLocationRepo.Setup(repo => repo.GetByIdAsync("1")).ReturnsAsync(existingLocation);
        _mockLocationRepo.Setup(repo => repo.FindUniqueAsync(It.IsAny<Expression<Func<Location, bool>>>()))
            .ReturnsAsync((Location?)null);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>());

        // Act
        var result = await _controller.UpdateLocation("1", updateRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLocation = Assert.IsType<Location>(okResult.Value);
        Assert.Equal(updateRequest.Name, returnedLocation.Name);
        Assert.Equal(updateRequest.DefaultEmail, returnedLocation.DefaultEmail);
    }

    [Fact]
    public async Task UpdateLocation_WithExistingIncidents_AllowsContactInfoUpdate()
    {
        // Arrange
        var existingLocation = new Location
        {
            Id = "1",
            Name = "Location",
            DefaultPhoneNumber = "123",
            DefaultEmail = "test@test.com"
        };
        var updateRequest = new LocationRequest(
            "Location", // Same name
            "456", // New phone
            "updated@test.com" // New email
        );

        _mockLocationRepo.Setup(repo => repo.GetByIdAsync("1")).ReturnsAsync(existingLocation);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>
            {
                new()
                {
                    Id = "incident1",
                    LocationId = "1"
                }
            });

        // Act
        var result = await _controller.UpdateLocation("1", updateRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLocation = Assert.IsType<Location>(okResult.Value);
        Assert.Equal(updateRequest.Name, returnedLocation.Name);
        Assert.Equal(updateRequest.DefaultPhoneNumber, returnedLocation.DefaultPhoneNumber);
        Assert.Equal(updateRequest.DefaultEmail, returnedLocation.DefaultEmail);
    }

    [Fact]
    public async Task UpdateLocation_WithExistingIncidents_PreventsTitleUpdate()
    {
        // Arrange
        var existingLocation = new Location
        {
            Id = "1",
            Name = "Location",
            DefaultPhoneNumber = "123",
            DefaultEmail = "test@test.com"
        };
        var updateRequest = new LocationRequest(
            "Updated Location", // Different name
            "456",
            "updated@test.com"
        );

        _mockLocationRepo.Setup(repo => repo.GetByIdAsync("1")).ReturnsAsync(existingLocation);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>
            {
                new()
                {
                    Id = "incident1",
                    LocationId = "1"
                }
            });

        // Act
        var result = await _controller.UpdateLocation("1", updateRequest);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Cannot modify the name", badRequestResult.Value?.ToString());
    }

    [Fact]
    public async Task DeleteLocation_WithNoIncidents_ReturnsNoContent()
    {
        // Arrange
        var location = new Location
        {
            Id = "1",
            Name = "Location",
            DefaultPhoneNumber = "",
            DefaultEmail = ""
        };
        _mockLocationRepo.Setup(repo => repo.GetByIdAsync("1")).ReturnsAsync(location);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>());

        // Act
        var result = await _controller.DeleteLocation("1");

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteLocation_WithExistingIncidents_ReturnsBadRequest()
    {
        // Arrange
        var location = new Location
        {
            Id = "1",
            Name = "Location",
            DefaultPhoneNumber = "",
            DefaultEmail = ""
        };
        _mockLocationRepo.Setup(repo => repo.GetByIdAsync("1")).ReturnsAsync(location);
        _mockIncidentRepo.Setup(repo => repo.FindAsync(It.IsAny<Expression<Func<Incident, bool>>>()))
            .ReturnsAsync(new List<Incident>
            {
                new()
                {
                    Id = "",
                    LocationId = ""
                }
            });

        // Act
        var result = await _controller.DeleteLocation("1");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("associated incidents", badRequestResult.Value?.ToString());
    }
}