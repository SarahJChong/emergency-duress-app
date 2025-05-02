using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
///     Controller for handling client-side error logs
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ErrorLogsController : ControllerBase
{
    private readonly ILogger<ErrorLogsController> _logger;
    private readonly IRepository<ErrorLog> _repository;

    /// <summary>
    ///     Initializes a new instance of the ErrorLogsController
    /// </summary>
    public ErrorLogsController(IRepository<ErrorLog> repository, ILogger<ErrorLogsController> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    ///     Records an error log from the client application
    /// </summary>
    /// <param name="request">The error log details</param>
    /// <returns>Success status if the log was recorded</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LogError([FromBody] ErrorLogRequest request)
    {
        try
        {
            // Create error log document
            var errorLog = new ErrorLog
            {
                Id = string.Empty,
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

            // Store in database
            var savedLog = await _repository.AddAsync(errorLog);

            // Log to application insights or other monitoring service
            _logger.LogError(
                "Client Error: {Message} on {Platform} {Version}",
                errorLog.Message,
                errorLog.DeviceInfo.Platform,
                errorLog.DeviceInfo.Version
            );

            return CreatedAtAction(nameof(LogError), new { id = savedLog.Id }, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record error log");
            return BadRequest();
        }
    }

    /// <summary>
    ///     Request model for submitting error logs
    /// </summary>
    public class ErrorLogRequest
    {
        public required string Message { get; set; } = string.Empty;

        public string? Stack { get; set; }

        public required long Timestamp { get; set; }

        public Dictionary<string, object>? Context { get; set; }

        public required DeviceInfo DeviceInfo { get; set; }
    }

    /// <summary>
    ///     Device information included in error logs
    /// </summary>
    public class DeviceInfo
    {
        public required string Platform { get; set; } = string.Empty;

        public required string Version { get; set; } = string.Empty;

        public string? Manufacturer { get; set; }

        public string? Model { get; set; }
    }
}