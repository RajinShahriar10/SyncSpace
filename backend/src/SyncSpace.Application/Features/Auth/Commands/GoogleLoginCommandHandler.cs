using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.Features.Auth.Commands;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, ApiResponse<AuthResponse>>
{
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public GoogleLoginCommandHandler(
        IGoogleAuthService googleAuthService,
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _googleAuthService = googleAuthService;
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await _googleAuthService.ValidateTokenAsync(request.IdToken);
        if (googleUser == null)
            return ApiResponse<AuthResponse>.Failure("Invalid Google token.");

        var userInfo = await _identityService.GetUserInfoByEmailAsync(googleUser.Email);

        if (userInfo == null)
        {
            var userId = Guid.NewGuid();
            var (success, errors) = await _identityService.CreateUserWithoutPasswordAsync(
                userId, googleUser.Email, googleUser.FirstName, googleUser.LastName, googleUser.Picture);

            if (!success)
                return ApiResponse<AuthResponse>.Failure(errors.First());

            await _identityService.AddToRoleAsync(userId, "Member");
            userInfo = await _identityService.GetUserInfoAsync(userId);
        }

        var roles = await _identityService.GetRolesAsync(userInfo!.Id);
        var tokens = await _jwtTokenService.GenerateTokensAsync(
            userInfo.Id, userInfo.Email, userInfo.FirstName, userInfo.LastName, roles);

        await _refreshTokenService.SaveTokenAsync(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = userInfo.Id,
            Expires = tokens.RefreshTokenExpiry,
            CreatedByIp = "google-oauth"
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
        }, "Google login successful");
    }
}
