using System.Security.Claims;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace Api.Controllers;



/// <summary>
/// Controller for managing user operations including registration, profile updates, and push notification tokens
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UsersController(IRepository<User> userRepository, IRepository<Location> locationRepository)
    : ControllerBase
{
    /// <summary>
    /// Registers or updates a user in the system using their authentication information and provided details
    /// </summary>
    /// <param name="request">Registration details including location, room number, and contact information</param>
    /// <returns>Created response with the user's ID if successful</returns>
    /// <response code="201">Returns the confirmation of user registration</response>
    /// <response code="401">If the authentication information is missing or invalid</response>
    [HttpPost("register")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Register(RegistrationRequest request)
    {
        var authId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        var authEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;

        // var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var roles = User.FindAll("emergency_app/roles").Select(c => c.Value).ToList();

        var authName = User.FindFirst(ClaimTypes.Name)?.Value ??
                       User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.GivenName)?.Value ??
                       User.FindFirst("given_name")?.Value;

        if (string.IsNullOrEmpty(authId) || string.IsNullOrEmpty(authEmail))
            return Unauthorized("No auth id or email provided");

        if (string.IsNullOrEmpty(authName))
            return Unauthorized("No auth name provided");


        // Check for existing user
        var existingUser = await userRepository.FindUniqueAsync(u =>
            u.ExternalId == authId);

        // Generate new ObjectId if needed
        var newId = existingUser?.Id ?? ObjectId.GenerateNewId().ToString();

        // Ensure we don't get an empty ObjectId
        if (string.IsNullOrEmpty(newId) || newId == ObjectId.Empty.ToString())
        {
            throw new InvalidOperationException("Failed to generate valid ObjectId");
        }

        var user = new User
        {
            ExternalId = authId,
            Id = newId,
            Name = authName,
            Email = authEmail,
            ContactNumber = request.ContactNumber,
            LocationId = request.LocationId,
            RoomNumber = request.RoomNumber,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
            Roles = roles
        };

        if (existingUser is null)
            await userRepository.AddAsync(user);
        else
            await userRepository.UpdateAsync(existingUser.Id, user);

        return CreatedAtAction(nameof(Register), new { id = user.Id }, "OK");
    }

    /// <summary>
    /// Retrieves the current user's profile information including their associated location
    /// </summary>
    /// <returns>The user's profile information with location details</returns>
    /// <response code="200">Returns the user's profile information</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="404">If the user profile is not found</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMe()
    {
        var authId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        // var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var roles = User.FindAll("emergency_app/roles").Select(c => c.Value).ToList();


        if (string.IsNullOrEmpty(authId)) return Unauthorized("No auth id provided");

        // fetch the user by ID and ensure it matches the authId
        var user = (await userRepository.FindAsync(u => u.ExternalId == authId)).FirstOrDefault();

        if (user == null) return NotFound(new { Message = "User not found or unauthorized." });

        // Fetch the location if the user has a LocationId
        Location? location = null;
        if (!string.IsNullOrEmpty(user.LocationId))
            location = (await locationRepository.FindAsync(l => l.Id == user.LocationId)).FirstOrDefault();

        // Update roles if they've changed
        if (!roles.SequenceEqual(user.Roles))
        {
            user.Roles = roles;
            user.UpdatedAt = DateTime.Now;
            await userRepository.UpdateAsync(user.Id, user);
        }

        // Construct response with the user and location
        var response = new UserResponse
        {
            Id = user.Id,
            ExternalId = user.ExternalId,
            Name = user.Name,
            Email = user.Email,
            ContactNumber = user.ContactNumber,
            RoomNumber = user.RoomNumber,
            LocationId = user.LocationId,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Location = location,
            Roles = user.Roles
        };

        return Ok(response);
    }

    /// <summary>
    /// Updates the current user's profile information
    /// </summary>
    /// <param name="request">Updated user details including location, room number, and contact information</param>
    /// <returns>The updated user profile with location information</returns>
    /// <response code="200">Returns the updated user profile</response>
    /// <response code="400">If the location ID is invalid</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="404">If the user profile is not found</response>
    [HttpPut("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMe(RegistrationRequest request)
    {
        var authId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        // var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var roles = User.FindAll("emergency_app/roles").Select(c => c.Value).ToList();


        if (string.IsNullOrEmpty(authId)) return Unauthorized("No auth id provided");

        // Fetch the current user
        var user = await userRepository.FindUniqueAsync(u => u.ExternalId == authId);
        if (user == null) return NotFound("User not found or unauthorized.");

        // Verify the location exists
        var location = await locationRepository.FindUniqueAsync(l => l.Id == request.LocationId);
        if (location == null) return BadRequest("Invalid location selected.");

        // Update only the allowed fields
        user.ContactNumber = request.ContactNumber;
        user.LocationId = request.LocationId;
        user.RoomNumber = request.RoomNumber;
        user.UpdatedAt = DateTime.Now;
        user.Roles = roles;

        await userRepository.UpdateAsync(user.Id, user);

        // Return the updated user with location information
        var response = new UserResponse
        {
            Id = user.Id,
            ExternalId = user.ExternalId,
            Name = user.Name,
            Email = user.Email,
            ContactNumber = user.ContactNumber,
            RoomNumber = user.RoomNumber,
            LocationId = user.LocationId,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Location = location,
            Roles = user.Roles
        };

        return Ok(response);
    }

    /// <summary>
    /// Updates the user's push notification token for their current device
    /// </summary>
    /// <param name="request">The push notification token to be added</param>
    /// <returns>Confirmation message of the token update</returns>
    /// <response code="200">Returns confirmation of the token update</response>
    /// <response code="400">If the token is empty or invalid</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="404">If the user profile is not found</response>
    [HttpPut("me/push-token")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePushToken(PushTokenRequest request)
    {
        // Skip if no token provided
        if (string.IsNullOrEmpty(request.Token))
            return BadRequest("Push token is required");

        var authId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(authId))
            return Unauthorized("No auth id provided");

        // Fetch the current user
        var user = await userRepository.FindUniqueAsync(u => u.ExternalId == authId);
        if (user == null)
            return NotFound("User not found or unauthorized.");

        // Add token if it doesn't exist
        if (!user.DeviceTokens.Contains(request.Token))
        {
            user.DeviceTokens.Add(request.Token);
            user.UpdatedAt = DateTime.Now;

            await userRepository.UpdateAsync(user.Id, user);
        }

        return Ok(new MessageResponse("Push token updated successfully"));
    }
}

/// <summary>
/// Request model for user registration and profile updates
/// </summary>
/// <param name="LocationId">The ID of the location the user belongs to</param>
/// <param name="RoomNumber">Optional room number for the user's location</param>
/// <param name="ContactNumber">Contact phone number for the user</param>
public record RegistrationRequest(string LocationId, string? RoomNumber, string ContactNumber);

/// <summary>
/// Request model for updating a user's push notification token
/// </summary>
/// <param name="Token">The push notification token for the user's device</param>
public record PushTokenRequest(string Token);

/// <summary>
/// Response model containing complete user profile information
/// </summary>
public class UserResponse
{
    /// <summary>The internal ID of the user</summary>
    public required string Id { get; set; }
    /// <summary>The external (authentication) ID of the user</summary>
    public required string ExternalId { get; set; }
    /// <summary>The full name of the user</summary>
    public required string Name { get; set; }
    /// <summary>The email address of the user</summary>
    public required string Email { get; set; }
    /// <summary>The contact phone number for the user</summary>
    public string? ContactNumber { get; set; }
    /// <summary>The room number at the user's location</summary>
    public string? RoomNumber { get; set; }
    /// <summary>The ID of the location the user belongs to</summary>
    public string? LocationId { get; set; }
    /// <summary>When the user profile was created</summary>
    public required DateTime CreatedAt { get; set; }
    /// <summary>When the user profile was last updated</summary>
    public required DateTime UpdatedAt { get; set; }
    /// <summary>The complete location information for the user</summary>
    public Location? Location { get; set; }
    /// <summary>The list of roles assigned to the user</summary>
    public required List<string> Roles { get; set; }
}

/// <summary>
/// Response model for simple message responses
/// </summary>
/// <param name="Message">The message to be returned to the client</param>
public record MessageResponse(string Message);