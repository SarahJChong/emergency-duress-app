using System.Linq.Expressions;
using System.Security.Claims;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Controllers;

public class UsersControllerTests
{
    private readonly UsersController _controller;
    private readonly Mock<IRepository<User>> _mockUserRepo;
    private readonly string _testAuthId = "test-auth-id";
    private readonly User _testUser;

    public UsersControllerTests()
    {
        _mockUserRepo = new Mock<IRepository<User>>();
        Mock<IRepository<Location>> mockLocationRepo = new();

        _testUser = new User
        {
            Id = "test-user-id",
            ExternalId = _testAuthId,
            Name = "Test User",
            Email = "test@example.com",
            DeviceTokens = new List<string>(),
            Roles = ["user"],
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _controller = new UsersController(_mockUserRepo.Object, mockLocationRepo.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, _testAuthId),
                        new Claim(ClaimTypes.Email, "test@example.com"),
                        new Claim(ClaimTypes.Name, "Test User"),
                        new Claim("emergency_app/roles", "user")
                    }))
                }
            }
        };
    }

    [Fact]
    public async Task UpdatePushToken_WithNewToken_AddsTokenAndUpdatesUser()
    {
        // Arrange
        var token = "test-push-token";
        _mockUserRepo.Setup(repo => repo.FindUniqueAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(_testUser);

        // Act
        var result = await _controller.UpdatePushToken(new PushTokenRequest(token));

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<MessageResponse>(okResult.Value);
        Assert.Equal("Push token updated successfully", response.Message);

        _mockUserRepo.Verify(repo => repo.UpdateAsync(
            _testUser.Id,
            It.Is<User>(u => u.DeviceTokens.Contains(token))
        ), Times.Once);

    }

    [Fact]
    public async Task UpdatePushToken_WithExistingToken_DoesNotUpdateUser()
    {
        // Arrange
        var token = "existing-token";
        _testUser.DeviceTokens.Add(token);
        _mockUserRepo.Setup(repo => repo.FindUniqueAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(_testUser);

        // Act
        var result = await _controller.UpdatePushToken(new PushTokenRequest(token));

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<MessageResponse>(okResult.Value);
        Assert.Equal("Push token updated successfully", response.Message);

        _mockUserRepo.Verify(repo => repo.UpdateAsync(It.IsAny<string>(), It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePushToken_WithEmptyToken_ReturnsBadRequest()
    {
        // Arrange
        var token = string.Empty;

        // Act
        var result = await _controller.UpdatePushToken(new PushTokenRequest(token));

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Push token is required", badRequestResult.Value);
    }

    [Fact]
    public async Task UpdatePushToken_WithoutAuthId_ReturnsUnauthorized()
    {
        // Arrange
        var token = "test-token";
        var controller = new UsersController(_mockUserRepo.Object, Mock.Of<IRepository<Location>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };

        // Act
        var result = await controller.UpdatePushToken(new PushTokenRequest(token));

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("No auth id provided", unauthorizedResult.Value);
    }

}