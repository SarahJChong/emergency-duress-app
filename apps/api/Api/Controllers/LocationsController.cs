using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
///     Record for location create/update requests containing only the fields sent from frontend
/// </summary>
public record LocationRequest(
    string Name,
    string DefaultPhoneNumber,
    string DefaultEmail);

/// <summary>Record for adding a security responder to a location</summary>
public record SecurityResponderRequest(string Email);

[ApiController]
[Route("/api/[controller]")]
public class LocationsController(
    IRepository<Location> locationRepository,
    IRepository<Incident> incidentRepository,
    IRepository<User> userRepository)
    : ControllerBase
{
    /// <summary>
    ///     Gets all locations. If user is an admin, includes hasIncidents flag.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetLocations()
    {
        var allLocations = await locationRepository.GetAllAsync();

        if (!allLocations.Any())
        {
            // Create a default location if none exist
            var defaultLocation = new Location
            {
                Id = string.Empty, // MongoDB will generate this
                Name = "Default Location",
                DefaultPhoneNumber = string.Empty,
                DefaultEmail = string.Empty,
                SecurityResponders = new List<SecurityResponder>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            allLocations = new[] { await locationRepository.AddAsync(defaultLocation) };
        }

        var isAdmin = User.IsInRole("admin");
        if (!isAdmin) return Ok(allLocations);

        // For admins, check incidents for each location
        foreach (var location in allLocations)
        {
            var hasIncidents = await HasAssociatedIncidents(location.Id);
            location.HasIncidents = hasIncidents;
        }

        return Ok(allLocations);
    }

    /// <summary>
    ///     Creates a new location
    /// </summary>
    /// <param name="request">The location creation data with name, default phone number, and default email</param>
    /// <returns>The created location</returns>
    /// <response code="201">Returns the newly created location</response>
    /// <response code="400">If the location name already exists</response>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLocation([FromBody] LocationRequest request)
    {
        // Check if name is unique
        var existingLocation = await locationRepository.FindUniqueAsync(l => l.Name == request.Name);
        if (existingLocation != null) return BadRequest(new { Message = "A location with this name already exists" });

        var location = new Location
        {
            Id = string.Empty, // MongoDB will generate this
            Name = request.Name,
            DefaultPhoneNumber = request.DefaultPhoneNumber,
            DefaultEmail = request.DefaultEmail,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdLocation = await locationRepository.AddAsync(location);
        return CreatedAtAction(nameof(GetLocations), new { id = createdLocation.Id }, createdLocation);
    }

    /// <summary>
    ///     Updates an existing location by its ID
    /// </summary>
    /// <param name="id">The ID of the location to update</param>
    /// <param name="request">The location update data with name, default phone number, and default email</param>
    /// <returns>The updated location</returns>
    /// <response code="200">Returns the updated location</response>
    /// <response code="400">If the location has incidents or if the new name already exists</response>
    /// <response code="404">If the location is not found</response>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLocation(string id, [FromBody] LocationRequest request)
    {
        var existingLocation = await locationRepository.GetByIdAsync(id);
        if (existingLocation == null) return NotFound(new { Message = "Location not found" });

        // Check for incidents when updating name, as this is an admin-only operation
        var hasIncidents = await HasAssociatedIncidents(id);
        if (hasIncidents && existingLocation.Name != request.Name)
        {
            return BadRequest(new { Message = "Cannot modify the name of a location that has associated incidents" });
        }

        // Check if new name is unique if name is being changed
        if (existingLocation.Name != request.Name)
        {
            var nameExists = await locationRepository.FindUniqueAsync(l => l.Name == request.Name && l.Id != id);
            if (nameExists != null) return BadRequest(new { Message = "A location with this name already exists" });
        }

        existingLocation.Name = request.Name;
        existingLocation.DefaultPhoneNumber = request.DefaultPhoneNumber;
        existingLocation.DefaultEmail = request.DefaultEmail;
        existingLocation.UpdatedAt = DateTime.UtcNow;

        await locationRepository.UpdateAsync(id, existingLocation);
        return Ok(existingLocation);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteLocation(string id)
    {
        var location = await locationRepository.GetByIdAsync(id);
        if (location == null) return NotFound(new { Message = "Location not found" });

        var hasIncidents = await HasAssociatedIncidents(id);
        if (hasIncidents) return BadRequest(new { Message = "Cannot delete location with associated incidents" });

        await locationRepository.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>
    ///     Adds a security responder to a location
    /// </summary>
    /// <param name="id">The ID of the location</param>
    /// <param name="request">The security responder's email address</param>
    /// <returns>The updated location with the new security responder</returns>
    /// <response code="200">Returns the updated location</response>
    /// <response code="400">If the security responder is already assigned to this location</response>
    /// <response code="404">If the location is not found</response>
    [HttpPost("{id}/security-responders")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddSecurityResponder(string id, [FromBody] SecurityResponderRequest request)
    {
        var location = await locationRepository.GetByIdAsync(id);
        if (location == null) return NotFound(new { Message = "Location not found" });

        var user = await userRepository.FindUniqueAsync(u => u.Email == request.Email);
        if (user == null) return NotFound(new { Message = "User not found" });

        var userRoles = user.Roles;
        if (!userRoles.Contains("security"))
            return BadRequest(new { Message = "User is not a security responder" });

        if (location.SecurityResponders.Any(sr => sr.Email == request.Email))
            return BadRequest(new { Message = "Security responder is already assigned to this location" });

        var securityResponder = new SecurityResponder { Id = user.Id, Name = user.Name, Email = user.Email };
        location.SecurityResponders.Add(securityResponder);
        location.UpdatedAt = DateTime.UtcNow;

        await locationRepository.UpdateAsync(id, location);
        return Ok(location);
    }

    /// <summary>
    ///     Removes a security responder from a location
    /// </summary>
    /// <param name="id">The ID of the location</param>
    /// <param name="email">The email address of the security responder to remove</param>
    /// <returns>No content if successful</returns>
    /// <response code="204">If the security responder was successfully removed</response>
    /// <response code="404">If the location is not found or the security responder is not assigned to this location</response>
    [HttpDelete("{id}/security-responders/{email}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveSecurityResponder(string id, string email)
    {
        var location = await locationRepository.GetByIdAsync(id);
        if (location == null) return NotFound(new { Message = "Location not found" });

        var responder = location.SecurityResponders.FirstOrDefault(sr => sr.Email == email);
        if (responder == null) return NotFound(new { Message = "Security responder is not assigned to this location" });

        location.SecurityResponders.Remove(responder);
        location.UpdatedAt = DateTime.UtcNow;

        await locationRepository.UpdateAsync(id, location);
        return NoContent();
    }

    /// <summary>
    ///     Gets all users with the security role that can be assigned as responders
    /// </summary>
    [HttpGet("security-responders")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSecurityResponders()
    {
        // Get all users and filter based on roles from their tokens
        var allUsers = await userRepository.FindAsync(u => u.Roles.Contains("security"));
        var securityResponders =
            allUsers.Select(u => new SecurityResponder { Id = u.Id, Name = u.Name, Email = u.Email });
        return Ok(securityResponders);
    }

    /// <summary>
    ///     Checks if the location has any incidents associated with it.
    /// </summary>
    /// <param name="locationId">The ID of the location to check</param>
    /// <returns>True if there are any incidents associated with the location</returns>
    private async Task<bool> HasAssociatedIncidents(string locationId)
    {
        var incidents = await incidentRepository.FindAsync(i => i.LocationId == locationId);
        return incidents.Any();
    }
}