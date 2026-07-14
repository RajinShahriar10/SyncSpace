using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.Features.Auth.Commands;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, ApiResponse<AuthResponse>>
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public RegisterCommandHandler(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _identityService.GetUserInfoByEmailAsync(request.Email);
        if (existingUser != null)
            return ApiResponse<AuthResponse>.Failure("An account with this email already exists.");

        var userId = Guid.NewGuid();
        var (success, errors) = await _identityService.CreateUserAsync(
            userId, request.Email, request.Password, request.FirstName, request.LastName);

        if (!success)
            return ApiResponse<AuthResponse>.Failure(errors.First(), System.Net.HttpStatusCode.BadRequest);

        await _identityService.AddToRoleAsync(userId, "Member");

        var roles = await _identityService.GetRolesAsync(userId);
        var tokens = await _jwtTokenService.GenerateTokensAsync(
            userId, request.Email, request.FirstName, request.LastName, roles);

        await _refreshTokenService.SaveTokenAsync(new RefreshToken
        {
            Token = tokens.RefreshToken,
            UserId = userId,
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
                Id = userId,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName
            }
        }, "Registration successful");
    }
}
