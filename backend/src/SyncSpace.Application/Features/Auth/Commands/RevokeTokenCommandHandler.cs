using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.Features.Auth.Commands;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand, ApiResponse<bool>>
{
    private readonly IRefreshTokenService _refreshTokenService;

    public RevokeTokenCommandHandler(IRefreshTokenService refreshTokenService)
    {
        _refreshTokenService = refreshTokenService;
    }

    public async Task<ApiResponse<bool>> Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var token = await _refreshTokenService.GetActiveTokenAsync(request.RefreshToken, Guid.Empty);
        if (token == null)
            return ApiResponse<bool>.Failure("Invalid refresh token.");

        await _refreshTokenService.RevokeTokenAsync(token);

        return ApiResponse<bool>.SuccessResponse(true, "Refresh token revoked.");
    }
}
