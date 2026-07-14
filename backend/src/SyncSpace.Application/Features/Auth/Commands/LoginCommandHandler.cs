using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.Features.Auth.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<AuthResponse>>
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public LoginCommandHandler(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var userInfo = await _identityService.GetUserInfoByEmailAsync(request.Email);
        if (userInfo == null)
            return ApiResponse<AuthResponse>.Failure("Invalid email or password.");

        var lockoutEnd = await _identityService.GetLockoutEndAsync(userInfo.Id);
        if (lockoutEnd.HasValue && lockoutEnd.Value > DateTime.UtcNow)
            return ApiResponse<AuthResponse>.Failure("Account is locked. Please try again later.");

        if (!await _identityService.IsUserActiveAsync(userInfo.Id))
            return ApiResponse<AuthResponse>.Failure("Account has been deactivated. Please contact support.");

        var (success, error) = await _identityService.CheckPasswordAsync(request.Email, request.Password);
        if (!success)
        {
            var attempts = await _identityService.GetFailedLoginAttemptsAsync(userInfo.Id);
            if (attempts >= 4)
            {
                await _identityService.LockoutUserAsync(userInfo.Id, TimeSpan.FromMinutes(30));
                await _identityService.ResetFailedAttemptsAsync(userInfo.Id);
                return ApiResponse<AuthResponse>.Failure("Account locked due to too many failed attempts. Try again in 30 minutes.");
            }

            await _identityService.IncrementFailedAttemptsAsync(userInfo.Id);
            return ApiResponse<AuthResponse>.Failure("Invalid email or password.");
        }

        var failedAttempts = await _identityService.GetFailedLoginAttemptsAsync(userInfo.Id);
        if (failedAttempts > 0)
            await _identityService.ResetFailedAttemptsAsync(userInfo.Id);

        await _identityService.SetLastLoginAsync(userInfo.Id);

        var roles = await _identityService.GetRolesAsync(userInfo.Id);
        var tokens = await _jwtTokenService.GenerateTokensAsync(
            userInfo.Id, userInfo.Email, userInfo.FirstName, userInfo.LastName, roles);

        await _refreshTokenService.SaveTokenAsync(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = userInfo.Id,
            Expires = tokens.RefreshTokenExpiry,
            CreatedByIp = "system"
        });

        return ApiResponse<AuthResponse>.SuccessResponse(new AuthResponse
        {
            AccessToken = tokens.AccessToken,
            RefreshToken = tokens.RefreshToken,
            RefreshTokenExpiry = tokens.RefreshTokenExpiry,
            User = new UserDto
            {
                Id = userInfo.Id,
                Email = userInfo.Email,
                FirstName = userInfo.FirstName,
                LastName = userInfo.LastName,
                AvatarUrl = userInfo.AvatarUrl
            }
        }, "Login successful");
    }
}
