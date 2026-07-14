using MediatR;
using SyncSpace.Application.Common.Models;

namespace SyncSpace.Application.Features.Auth.DTOs;

public record RegisterCommand : IRequest<ApiResponse<AuthResponse>>
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string ConfirmPassword { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
}

public record LoginCommand : IRequest<ApiResponse<AuthResponse>>
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public bool RememberMe { get; init; }
}

public record RefreshTokenCommand : IRequest<ApiResponse<AuthResponse>>
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
}

public record GoogleLoginCommand : IRequest<ApiResponse<AuthResponse>>
{
    public string IdToken { get; init; } = string.Empty;
}

public record RevokeTokenCommand : IRequest<ApiResponse<bool>>
{
    public string RefreshToken { get; init; } = string.Empty;
}

public record AuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime RefreshTokenExpiry { get; init; }
    public UserDto User { get; init; } = null!;
}

public record UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string FullName => $"{FirstName} {LastName}";
}
