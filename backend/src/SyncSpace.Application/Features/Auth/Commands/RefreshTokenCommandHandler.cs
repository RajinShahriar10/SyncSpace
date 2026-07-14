using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.Features.Auth.Commands;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthResponse>>
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public RefreshTokenCommandHandler(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
            return ApiResponse<AuthResponse>.Failure("Invalid access token.");

        var userIdStr = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId))
            return ApiResponse<AuthResponse>.Failure("Invalid token.");

        var userInfo = await _identityService.GetUserInfoAsync(userId);
        if (userInfo == null)
            return ApiResponse<AuthResponse>.Failure("User not found.");

        var storedToken = await _refreshTokenService.GetActiveTokenAsync(request.RefreshToken, userId);
        if (storedToken == null)
            return ApiResponse<AuthResponse>.Failure("Invalid refresh token.");

        if (!storedToken.IsActive)
            return ApiResponse<AuthResponse>.Failure("Refresh token has expired or been revoked.");

        var roles = await _identityService.GetRolesAsync(userId);
        var tokens = await _jwtTokenService.GenerateTokensAsync(
            userId, userInfo.Email, userInfo.FirstName, userInfo.LastName, roles);

        await _refreshTokenService.RevokeTokenAsync(storedToken, tokens.RefreshToken);

        await _refreshTokenService.SaveTokenAsync(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = userId,
            Expires = tokens.RefreshTokenExpiry,
            CreatedByIp = "system",
            ReplacedByToken = storedToken.Token
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
        });
    }
}
