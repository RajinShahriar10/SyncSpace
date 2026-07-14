using Microsoft.EntityFrameworkCore;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Persistence.Context;

namespace SyncSpace.Infrastructure.Identity;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly SyncSpaceDbContext _context;

    public RefreshTokenService(SyncSpaceDbContext context)
    {
        _context = context;
    }

    public async Task<Domain.Entities.RefreshToken?> GetActiveTokenAsync(string token, Guid userId)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.UserId == userId);
    }

    public async Task SaveTokenAsync(Domain.Entities.RefreshToken refreshToken)
    {
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
    }

    public async Task RevokeTokenAsync(Domain.Entities.RefreshToken refreshToken, string? replacedByToken = null)
    {
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = "system";
        if (replacedByToken != null)
            refreshToken.ReplacedByToken = replacedByToken;
        await _context.SaveChangesAsync();
    }
}
