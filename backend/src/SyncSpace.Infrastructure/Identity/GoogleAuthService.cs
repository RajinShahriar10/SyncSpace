using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Identity;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GoogleAuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<ExternalUserInfo?> ValidateTokenAsync(string idToken)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
                return null;

            var response = await _httpClient.GetFromJsonAsync<JsonElement>(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

            var email = response.GetProperty("email").GetString();
            var emailVerified = response.GetProperty("email_verified").GetBoolean();

            if (string.IsNullOrEmpty(email) || !emailVerified)
                return null;

            var audience = response.GetProperty("aud").GetString();
            if (audience != clientId)
                return null;

            return new ExternalUserInfo
            {
                Email = email,
                FirstName = response.TryGetProperty("given_name", out var gn) ? gn.GetString() ?? "" : "",
                LastName = response.TryGetProperty("family_name", out var fn) ? fn.GetString() ?? "" : "",
                Picture = response.TryGetProperty("picture", out var pic) ? pic.GetString() : null,
                ExternalId = response.TryGetProperty("sub", out var sub) ? sub.GetString() : null
            };
        }
        catch
        {
            return null;
        }
    }
}
