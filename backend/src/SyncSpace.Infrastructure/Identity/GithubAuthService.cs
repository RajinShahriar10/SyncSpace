using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Identity;

public class GithubAuthService : IGithubAuthService
{
    private readonly HttpClient _httpClient;

    public GithubAuthService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ExternalUserInfo?> GetUserInfoAsync(string accessToken)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", accessToken);
            _httpClient.DefaultRequestHeaders.UserAgent.Add(
                new ProductInfoHeaderValue("SyncSpace", "1.0"));

            var userResponse = await _httpClient.GetFromJsonAsync<JsonElement>(
                "https://api.github.com/user");

            var email = userResponse.TryGetProperty("email", out var emailProp)
                ? emailProp.GetString() : null;

            if (string.IsNullOrEmpty(email))
            {
                var emails = await _httpClient.GetFromJsonAsync<JsonElement[]>(
                    "https://api.github.com/user/emails");
                email = emails?.FirstOrDefault(e =>
                    e.GetProperty("primary").GetBoolean())?
                    .GetProperty("email").GetString();
            }

            if (string.IsNullOrEmpty(email))
                return null;

            var name = userResponse.GetProperty("name").GetString() ?? "";
            var nameParts = name.Split(' ', 2);

            return new ExternalUserInfo
            {
                Email = email,
                FirstName = nameParts.Length > 0 ? nameParts[0] : "",
                LastName = nameParts.Length > 1 ? nameParts[1] : "",
                Picture = userResponse.TryGetProperty("avatar_url", out var avatar)
                    ? avatar.GetString() : null,
                ExternalId = userResponse.GetProperty("id").ToString()
            };
        }
        catch
        {
            return null;
        }
    }
}
