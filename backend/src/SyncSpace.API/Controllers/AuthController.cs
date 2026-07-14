using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Application.Features.Auth.Commands;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuditService _auditService;

    public AuthController(IMediator mediator, IAuditService auditService)
    {
        _mediator = mediator;
        _auditService = auditService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            await _auditService.LogAsync(
                result.Data.User.Id, AuditAction.UserRegister, "User", result.Data.User.Id, null,
                "User registered: " + result.Data.User.Email,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: HttpContext.Request.Headers.UserAgent.ToString());
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            await _auditService.LogAsync(
                result.Data.User.Id, AuditAction.UserLogin, "User", result.Data.User.Id, null,
                "User logged in: " + result.Data.User.Email,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: HttpContext.Request.Headers.UserAgent.ToString());
        }
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("google")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            await _auditService.LogAsync(
                result.Data.User.Id, AuditAction.UserLogin, "User", result.Data.User.Id, null,
                "Google login: " + result.Data.User.Email,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: HttpContext.Request.Headers.UserAgent.ToString());
        }
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("github")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GithubLogin([FromBody] GithubLoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            await _auditService.LogAsync(
                result.Data.User.Id, AuditAction.UserLogin, "User", result.Data.User.Id, null,
                "GitHub login: " + result.Data.User.Email,
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: HttpContext.Request.Headers.UserAgent.ToString());
        }
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [Authorize]
    [HttpPost("revoke")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenCommand command)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        var result = await _mediator.Send(command);
        if (result.Success && userIdClaim != null)
        {
            var userId = Guid.Parse(userIdClaim.Value);
            await _auditService.LogAsync(
                userId, AuditAction.UserLogout, "User", userId, null,
                "User logged out",
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: HttpContext.Request.Headers.UserAgent.ToString());
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public IActionResult GetCurrentUser()
    {
        var user = new UserDto
        {
            Id = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value),
            Email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)!.Value,
            FirstName = User.FindFirst(System.Security.Claims.ClaimTypes.GivenName)!.Value,
            LastName = User.FindFirst(System.Security.Claims.ClaimTypes.Surname)!.Value
        };
        return Ok(ApiResponse<UserDto>.SuccessResponse(user));
    }
}
