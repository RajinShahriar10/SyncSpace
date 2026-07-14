using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Identity;

public class GithubAuthService : IGithubAuthService
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;
    private readonly string _clientSecret;

    public GithubAuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _clientId = Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID")
            ?? configuration["GitHub:ClientId"]
            ?? "";
        _clientSecret = Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET")
            ?? configuration["GitHub:ClientSecret"]
            ?? "";
    }

    public async Task<ExternalUserInfo?> GetUserInfoAsync(string code)
    {
        try
        {
            var tokenResponse = await _httpClient.PostAsJsonAsync(
                "https://github.com/login/oauth/access_token",
                new
                {
                    client_id = _clientId,
                    client_secret = _clientSecret,
                    code
                });

            var tokenContent = await tokenResponse.Content.ReadAsStringAsync();
            var tokenDoc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(tokenContent);

            if (tokenDoc == null || !tokenDoc.TryGetValue("access_token", out var accessTokenElement))
                return null;

            var accessToken = accessTokenElement.GetString();
            if (string.IsNullOrEmpty(accessToken))
                return null;

            var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.UserAgent.Add(new ProductInfoHeaderValue("SyncSpace", "1.0"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var userResponse = await _httpClient.SendAsync(request);
            var userJson = await userResponse.Content.ReadAsStringAsync();
            var userElement = JsonSerializer.Deserialize<JsonElement>(userJson);

            var email = userElement.TryGetProperty("email", out var emailProp)
                ? emailProp.GetString() : null;

            if (string.IsNullOrEmpty(email))
            {
                var emailRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
                emailRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                emailRequest.Headers.UserAgent.Add(new ProductInfoHeaderValue("SyncSpace", "1.0"));
                emailRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var emailResponse = await _httpClient.SendAsync(emailRequest);
                var emails = await emailResponse.Content.ReadFromJsonAsync<JsonElement[]>();

                if (emails != null)
                {
                    foreach (var e in emails)
                    {
                        if (e.TryGetProperty("primary", out var primary) && primary.GetBoolean())
                        {
                            email = e.TryGetProperty("email", out var emailVal)
                                ? emailVal.GetString() : null;
                            break;
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(email))
                return null;

            var name = userElement.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString() ?? "" : "";
            var nameParts = name.Split(' ', 2);

            return new ExternalUserInfo
            {
                Email = email,
                FirstName = nameParts.Length > 0 ? nameParts[0] : "",
                LastName = nameParts.Length > 1 ? nameParts[1] : "",
                Picture = userElement.TryGetProperty("avatar_url", out var avatar)
                    ? avatar.GetString() : null,
                ExternalId = userElement.TryGetProperty("id", out var idProp)
                    ? idProp.ToString() : ""
            };
        }
        catch
        {
            return null;
        }
    }
}
