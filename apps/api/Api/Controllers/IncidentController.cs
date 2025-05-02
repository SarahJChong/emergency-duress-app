using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Api.Models;
using Api.Services;
using Api.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver.GeoJsonObjectModel;

namespace Api.Controllers;

public class IncidentDetailsResponse : Incident
{
    /// <summary>
    ///     The associated location details
    /// </summary>
    public Location? Location { get; set; }
}

public class CreateIncidentRequest
{
    [Required] public required string LocationId { get; set; }

    public string? RoomNumber { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsAnonymous { get; set; } = false;
}

public class SyncIncidentRequest
{
    [Required] public required string LocationId { get; set; }
    [Required] public required string CreatedAt { get; set; }

    public string? RoomNumber { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsAnonymous { get; set; } = false;
    public string? CancellationReason { get; set; }
}

public class CancelIncidentRequest
{
    [Required] public required string CancellationReason { get; set; }
}

public class CloseIncidentRequest
{
    [Required] public required string ClosureNotes { get; set; }

    [Required] public required string ClosedBy { get; set; }
}

public class ListIncidentsQuery
{
    public string? LocationId { get; set; }
    public string? Status { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? SortBy { get; set; } = "date"; // "date" or "status"
    public string? SortOrder { get; set; } = "desc"; // "asc" or "desc"
}

[ApiController]
[Route("api/incident")]
[Authorize]
public class IncidentController(
    IRepository<Incident> incidentRepository,
    IRepository<User> userRepository,
    IRepository<Location> locationRepository,
    INotificationService notificationService)
    : ControllerBase
{
    private async Task<User?> GetCurrentUser()
    {
        var userExternalId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userExternalId)) return null;

        return await userRepository.FindUniqueAsync(u => u.ExternalId == userExternalId);
    }

    private async Task<Incident?> GetActiveIncidentForUser(string userId)
    {
        return (await incidentRepository.FindAsync(i =>
            i.UserId == userId &&
            i.Status == IncidentStatus.Open)).FirstOrDefault();
    }

    /// <summary>
    ///     Lists incidents based on user role and optional location filter.
    ///     Security responders can only view incidents for their assigned location.
    ///     Company managers can view all incidents and optionally filter by location.
    /// </summary>
    [HttpGet("list")]
    [Authorize(Roles = "security,manager")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListIncidents([FromQuery] ListIncidentsQuery query)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var isSecurity = User.IsInRole("security");
        var isManager = User.IsInRole("manager");

        if (!isSecurity && !isManager)
            return Forbid("User must be a security responder or company manager.");

        // For security responders, find all locations they are assigned to
        var authorizedLocationIds = new List<string>();
        if (isSecurity)
        {
            authorizedLocationIds = (await locationRepository.FindAsync(l =>
                l.SecurityResponders.Any(sr => sr.Id == user.Id))).Select(l => l.Id).ToList();

            if (!authorizedLocationIds.Any())
                return BadRequest("Security responder is not assigned to any locations.");
        }

        // Get incidents based on role and location filter
        var incidents = isManager && string.IsNullOrEmpty(query.LocationId)
            ? await incidentRepository.GetAllAsync()
            : await incidentRepository.FindAsync(i =>
                (isSecurity && authorizedLocationIds.Contains(i.LocationId)) ||
                (!isSecurity && i.LocationId == query.LocationId));

        // Apply status filter if provided
        if (!string.IsNullOrEmpty(query.Status))
            if (Enum.TryParse<IncidentStatus>(query.Status, true, out var status))
                incidents = incidents.Where(i => i.Status == status);

        // Apply date filters if provided
        if (query.DateFrom.HasValue) incidents = incidents.Where(i => i.DateCalled >= query.DateFrom.Value);
        if (query.DateTo.HasValue) incidents = incidents.Where(i => i.DateCalled <= query.DateTo.Value);


        // Extract distinct location IDs from the incidents
        var distinctLocationIds = incidents
            .Where(i => !string.IsNullOrEmpty(i.LocationId))
            .Select(i => i.LocationId)
            .Distinct()
            .ToList();

        // Fetch all needed locations in a single query
        var locations = !distinctLocationIds.Any()
            ? new List<Location>()
            : await locationRepository.FindAsync(l => distinctLocationIds.Contains(l.Id));

        // Create a lookup dictionary for quick access to locations
        var locationLookup = locations.ToDictionary(l => l.Id, l => l);

        // Map incidents to responses with locations from the lookup
        var responses = incidents.Select(incident => new IncidentDetailsResponse
        {
            Id = incident.Id,
            DateCalled = incident.DateCalled,
            DateClosed = incident.DateClosed,
            Status = incident.Status,
            UserId = incident.UserId,
            Name = incident.Name,
            ContactNumber = incident.ContactNumber,
            LocationId = incident.LocationId,
            RoomNumber = incident.RoomNumber,
            GpsCoordinates = incident.GpsCoordinates,
            ClosedBy = incident.ClosedBy,
            ClosureNotes = incident.ClosureNotes,
            CancellationReason = incident.CancellationReason,
            IsAnonymous = incident.IsAnonymous,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            Location = !string.IsNullOrEmpty(incident.LocationId) &&
                       locationLookup.TryGetValue(incident.LocationId, out var location)
                ? location
                : null
        }).ToList();

        // Apply sorting
        var sortedIncidents = query.SortBy?.ToLower() switch
        {
            "status" => query.SortOrder?.ToLower() == "asc"
                ? responses.OrderBy(i => i.Status)
                : responses.OrderByDescending(i => i.Status),
            _ => query.SortOrder?.ToLower() == "asc"
                ? responses.OrderBy(i => i.DateCalled)
                : responses.OrderByDescending(i => i.DateCalled)
        };


        return Ok(sortedIncidents);
    }

    /// <summary>
    ///     Creates a new emergency incident record.
    /// </summary>
    /// <param name="request">The incident creation request.</param>
    /// <returns>The created incident details.</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateIncident(CreateIncidentRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        // Check if user already has an active incident
        var activeIncident = await GetActiveIncidentForUser(user.Id);
        if (activeIncident != null) return BadRequest("User already has an active incident.");

        var currentTime = DateTime.UtcNow;
        var incident = new Incident
        {
            Id = string.Empty, // MongoDB will generate this
            DateCalled = currentTime,
            Status = IncidentStatus.Open,
            // Always store the user ID, even for anonymous incidents
            UserId = user.Id,
            // For anonymous incidents, we don't include personal information
            Name = request.IsAnonymous ? null : user.Name,
            ContactNumber = request.IsAnonymous ? null : user.ContactNumber,
            // Always include location ID, even for anonymous incidents
            LocationId = request.LocationId,
            // Only anonymize room number for anonymous incidents
            RoomNumber = request.IsAnonymous ? null : request.RoomNumber ?? user.RoomNumber,
            // Convert lat/lng to GeoJSON point if coordinates are provided
            GpsCoordinates = request.Latitude.HasValue && request.Longitude.HasValue
                ? new GeoJsonPoint<GeoJson2DCoordinates>(
                    new GeoJson2DCoordinates(request.Longitude.Value, request.Latitude.Value)
                )
                : null,
            IsAnonymous = request.IsAnonymous,
            CreatedAt = currentTime,
            UpdatedAt = currentTime
        };

        // Store the incident record
        var createdIncident = await incidentRepository.AddAsync(incident);

        // Get location details for the notification
        var location = await locationRepository.GetByIdAsync(incident.LocationId);
        if (location != null)
            try
            {
                // Send notification to security responders
                await notificationService.SendDistressNotificationAsync(createdIncident, location);
            }
            catch
            {
                // Notification failure should not prevent incident creation
            }

        return CreatedAtAction(
            nameof(CreateIncident),
            new
            {
                id = createdIncident.Id,
                timestamp = createdIncident.DateCalled,
                status = createdIncident.Status.ToString(),
                isAnonymous = createdIncident.IsAnonymous
            });
    }

    /// <summary>
    ///     Cancels the user's active incident.
    /// </summary>
    /// <param name="request">The cancellation request containing the reason.</param>
    /// <returns>The cancelled incident</returns>
    [HttpPost("cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelIncident(CancelIncidentRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var activeIncident = await GetActiveIncidentForUser(user.Id);
        if (activeIncident == null) return NotFound("No active incident found to cancel.");

        if (string.IsNullOrEmpty(request.CancellationReason)) return BadRequest("Cancellation reason is required.");

        activeIncident.Status = IncidentStatus.Cancelled;
        activeIncident.CancellationReason = request.CancellationReason;
        activeIncident.DateClosed = DateTime.UtcNow;
        activeIncident.UpdatedAt = DateTime.UtcNow;

        await incidentRepository.UpdateAsync(activeIncident.Id, activeIncident);

        return Ok(activeIncident);
    }

    /// <summary>
    ///     Gets the user's active (open) incident if one exists.
    /// </summary>
    /// <returns>The active incident or 404 if none exists</returns>
    [HttpGet("active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveIncident()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var activeIncident = await GetActiveIncidentForUser(user.Id);
        if (activeIncident == null) return NotFound("No active incident found.");

        return Ok(activeIncident);
    }

    /// <summary>
    ///     Gets all incidents for the current user.
    ///     For regular users, only returns incidents from the last 30 days and any open incidents.
    /// </summary>
    /// <returns>List of incidents for the current user</returns>
    [HttpGet("user")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserIncidents()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var incidents = await incidentRepository.FindAsync(i => i.UserId == user.Id);

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        incidents = incidents.Where(i =>
            i.Status == IncidentStatus.Open ||
            i.DateCalled >= thirtyDaysAgo
        );

        // Extract distinct location IDs and bulk fetch locations
        var distinctLocationIds = incidents
            .Where(i => !string.IsNullOrEmpty(i.LocationId))
            .Select(i => i.LocationId)
            .Distinct()
            .ToList();

        var locations = !distinctLocationIds.Any()
            ? new List<Location>()
            : await locationRepository.FindAsync(l => distinctLocationIds.Contains(l.Id));

        var locationLookup = locations.ToDictionary(l => l.Id, l => l);

        // Map incidents to responses with locations from the lookup
        var responses = incidents.Select(incident => new IncidentDetailsResponse
        {
            Id = incident.Id,
            DateCalled = incident.DateCalled,
            DateClosed = incident.DateClosed,
            Status = incident.Status,
            UserId = incident.UserId,
            Name = incident.Name,
            ContactNumber = incident.ContactNumber,
            LocationId = incident.LocationId,
            RoomNumber = incident.RoomNumber,
            GpsCoordinates = incident.GpsCoordinates,
            ClosedBy = incident.ClosedBy,
            ClosureNotes = incident.ClosureNotes,
            CancellationReason = incident.CancellationReason,
            IsAnonymous = incident.IsAnonymous,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            Location = !string.IsNullOrEmpty(incident.LocationId) &&
                       locationLookup.TryGetValue(incident.LocationId, out var location)
                ? location
                : null
        }).ToList();

        // Sort by date called (newest first)
        return Ok(responses.OrderByDescending(i => i.DateCalled));
    }

    /// <summary>
    ///     Gets details of a specific incident.
    /// </summary>
    /// <param name="id">The incident ID</param>
    /// <returns>The incident details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIncidentDetails(string id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var incident = await incidentRepository.GetByIdAsync(id);
        if (incident == null) return NotFound("Incident not found.");

        // Security check: allow access for incident creator, security responders of the location, or managers
        // For security, check if user has access to this incident's location
        var isSecurityAuthorized = false;
        if (User.IsInRole("security"))
        {
            var location = await locationRepository.GetByIdAsync(incident.LocationId);
            isSecurityAuthorized = location?.SecurityResponders.Any(sr => sr.Id == user.Id) ?? false;
        }

        var isAuthorized = incident.UserId == user.Id ||
                           isSecurityAuthorized ||
                           User.IsInRole("manager");
        if (!isAuthorized)
            return Forbid("Not authorized to view this incident.");

        // Create response with location details
        var response = new IncidentDetailsResponse
        {
            // Copy all properties from incident
            Id = incident.Id,
            DateCalled = incident.DateCalled,
            DateClosed = incident.DateClosed,
            Status = incident.Status,
            UserId = incident.UserId,
            Name = incident.Name,
            ContactNumber = incident.ContactNumber,
            LocationId = incident.LocationId,
            RoomNumber = incident.RoomNumber,
            GpsCoordinates = incident.GpsCoordinates,
            ClosedBy = incident.ClosedBy,
            ClosureNotes = incident.ClosureNotes,
            CancellationReason = incident.CancellationReason,
            IsAnonymous = incident.IsAnonymous,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt
        };

        // Fetch location if LocationId is provided
        if (!string.IsNullOrEmpty(incident.LocationId))
            response.Location = await locationRepository.GetByIdAsync(incident.LocationId);

        return Ok(response);
    }

    /// <summary>
    ///     Synchronizes an offline incident, handling both creation and cancellation in one operation.
    ///     If a cancellation is requested for a non-existent incident, it will be created first.
    /// </summary>
    /// <param name="request">The sync request containing incident details and optional cancellation</param>
    /// <returns>The synchronized incident</returns>
    [HttpPost("sync")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SyncIncident(SyncIncidentRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        if (!DateTime.TryParse(request.CreatedAt, out var createdAtDate))
            return BadRequest("Invalid CreatedAt date format");

        // Look for existing incident with matching createdAt
        var existingIncident = (await incidentRepository.FindAsync(i =>
            i.UserId == user.Id &&
            i.CreatedAt == createdAtDate)).FirstOrDefault();

        if (existingIncident == null)
        {
            // Create new incident
            var currentTime = DateTime.UtcNow;
            var incident = new Incident
            {
                Id = string.Empty, // MongoDB will generate this
                DateCalled = createdAtDate,
                Status = IncidentStatus.Open,
                UserId = user.Id,
                Name = request.IsAnonymous ? null : user.Name,
                ContactNumber = request.IsAnonymous ? null : user.ContactNumber,
                LocationId = request.LocationId,
                RoomNumber = request.IsAnonymous ? null : request.RoomNumber ?? user.RoomNumber,
                // Convert lat/lng to GeoJSON point if coordinates are provided
                GpsCoordinates = request.Latitude.HasValue && request.Longitude.HasValue
                    ? new GeoJsonPoint<GeoJson2DCoordinates>(
                        new GeoJson2DCoordinates(request.Longitude.Value, request.Latitude.Value)
                    )
                    : null,
                IsAnonymous = request.IsAnonymous,
                CreatedAt = createdAtDate,
                UpdatedAt = currentTime
            };

            existingIncident = await incidentRepository.AddAsync(incident);
        }

        // If cancellation is requested, apply it
        if (!string.IsNullOrEmpty(request.CancellationReason))
        {
            existingIncident.Status = IncidentStatus.Cancelled;
            existingIncident.CancellationReason = request.CancellationReason;
            existingIncident.DateClosed = DateTime.UtcNow;
            existingIncident.UpdatedAt = DateTime.UtcNow;

            await incidentRepository.UpdateAsync(existingIncident.Id, existingIncident);
        }

        return Ok(existingIncident);
    }

    /// <summary>
    ///     Closes an incident with closure notes. Only accessible by security responders or managers.
    /// </summary>
    /// <param name="id">The incident ID to close</param>
    /// <param name="request">The closure request containing notes and closer information</param>
    /// <returns>The updated incident details</returns>
    [HttpPost("{id}/close")]
    [Authorize(Roles = "security,manager")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseIncident(string id, CloseIncidentRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized("User not authenticated.");

        var incident = await incidentRepository.GetByIdAsync(id);
        if (incident == null) return NotFound("Incident not found.");

        if (incident.Status != IncidentStatus.Open)
            return BadRequest("Only open incidents can be closed.");

        incident.Status = IncidentStatus.Closed;
        incident.ClosureNotes = request.ClosureNotes;
        incident.ClosedBy = request.ClosedBy;
        incident.DateClosed = DateTime.UtcNow;
        incident.UpdatedAt = DateTime.UtcNow;

        await incidentRepository.UpdateAsync(incident.Id, incident);
        return Ok(incident);
    }
}