using Microsoft.Extensions.Configuration;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Identity;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly IConfiguration _configuration;

    public GoogleAuthService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<GoogleUserInfo?> ValidateTokenAsync(string idToken)
    {
        try
        {
            // In production, use Google.Apis.Auth:
            // var payload = await GoogleJsonWebSignature.ValidateAsync(idToken,
            //     new GoogleJsonWebSignature.ValidationSettings
            //     {
            //         Audience = new[] { _configuration["Google:ClientId"] }
            //     });
            //
            // return new GoogleUserInfo
            // {
            //     Email = payload.Email,
            //     FirstName = payload.GivenName,
            //     LastName = payload.FamilyName,
            //     Picture = payload.Picture
            // };

            // Stub for development
            await Task.CompletedTask;
            return new GoogleUserInfo
            {
                Email = "user@gmail.com",
                FirstName = "Google",
                LastName = "User",
                Picture = null
            };
        }
        catch
        {
            return null;
        }
    }
}
