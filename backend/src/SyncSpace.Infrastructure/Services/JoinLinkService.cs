using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Services;

public class JoinLinkService : IJoinLinkService
{
    private readonly string _signingKey;
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromDays(7);

    public JoinLinkService(IConfiguration configuration)
    {
        _signingKey = configuration["Jwt:Key"] ?? "SyncSpaceJoinLinkDefaultKey";
    }

    public string GenerateJoinToken(Guid workspaceId, int role)
    {
        var expires = DateTimeOffset.UtcNow.Add(TokenLifetime).ToUnixTimeSeconds();
        var payload = $"{workspaceId:N}|{role}|{expires}";
        var signature = Sign(payload);

        var data = Convert.ToBase64String(Encoding.UTF8.GetBytes(payload + "|" + signature));
        return data.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public JoinLinkPayload? ValidateJoinToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        try
        {
            var padded = token.Replace('-', '+').Replace('_', '/');
            switch (token.Length % 4)
            {
                case 2: padded += "=="; break;
                case 3: padded += "="; break;
            }

            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(padded));
            var parts = decoded.Split('|');
            if (parts.Length != 4)
                return null;

            var payload = $"{parts[0]}|{parts[1]}|{parts[2]}";
            if (Sign(payload) != parts[3])
                return null;

            if (!Guid.TryParseExact(parts[0], "N", out var workspaceId))
                return null;

            if (!int.TryParse(parts[1], out var role))
                return null;

            if (!long.TryParse(parts[2], out var expiresUnix))
                return null;
            if (DateTimeOffset.FromUnixTimeSeconds(expiresUnix).UtcDateTime < DateTime.UtcNow)
                return null;

            return new JoinLinkPayload(workspaceId, role);
        }
        catch
        {
            return null;
        }
    }

    private string Sign(string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_signingKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
}
