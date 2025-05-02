using System;
using System.Threading.Tasks;
using Api.Controllers;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Api.Tests.Controllers
{
    public class ErrorLogsControllerTests
    {
        private readonly Mock<IRepository<ErrorLog>> _mockRepository;
        private readonly Mock<ILogger<ErrorLogsController>> _mockLogger;
        private readonly ErrorLogsController _controller;

        public ErrorLogsControllerTests()
        {
            _mockRepository = new Mock<IRepository<ErrorLog>>();
            _mockLogger = new Mock<ILogger<ErrorLogsController>>();
            _controller = new ErrorLogsController(_mockRepository.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task LogError_WithValidRequest_ReturnsCreatedResult()
        {
            // Arrange
            var request = new ErrorLogsController.ErrorLogRequest
            {
                Message = "Test error message",
                Stack = "Test stack trace",
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Context = new System.Collections.Generic.Dictionary<string, object>
                {
                    { "testKey", "testValue" }
                },
                DeviceInfo = new ErrorLogsController.DeviceInfo
                {
                    Platform = "iOS",
                    Version = "15.0",
                    Manufacturer = "Apple",
                    Model = "iPhone 13"
                }
            };

            var savedErrorLog = new ErrorLog
            {
                Id = "test-id",
                Message = request.Message,
                Stack = request.Stack,
                Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(request.Timestamp),
                Context = request.Context,
                DeviceInfo = new ErrorLogDeviceInfo
                {
                    Platform = request.DeviceInfo.Platform,
                    Version = request.DeviceInfo.Version,
                    Manufacturer = request.DeviceInfo.Manufacturer,
                    Model = request.DeviceInfo.Model
                }
            };

            _mockRepository
                .Setup(r => r.AddAsync(It.IsAny<ErrorLog>()))
                .ReturnsAsync(savedErrorLog);

            // Act
            var result = await _controller.LogError(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal("LogError", createdResult.ActionName);
            Assert.Equal(savedErrorLog.Id, (createdResult.RouteValues?["id"] as string));
        }

        [Fact]
        public async Task LogError_WhenRepositoryThrows_ReturnsBadRequest()
        {
            // Arrange
            var request = new ErrorLogsController.ErrorLogRequest
            {
                Message = "Test error message",
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                DeviceInfo = new ErrorLogsController.DeviceInfo
                {
                    Platform = "iOS",
                    Version = "15.0"
                }
            };

            _mockRepository
                .Setup(r => r.AddAsync(It.IsAny<ErrorLog>()))
                .ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.LogError(request);

            // Assert
            Assert.IsType<BadRequestResult>(result);
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((o, t) => true),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task LogError_WithNullDeviceInfo_ReturnsBadRequest()
        {
            // Arrange
            var request = new ErrorLogsController.ErrorLogRequest
            {
                Message = "Test error message",
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                DeviceInfo = null!
            };

            // Act
            var result = await _controller.LogError(request);

            // Assert
            Assert.IsType<BadRequestResult>(result);
        }
    }
}