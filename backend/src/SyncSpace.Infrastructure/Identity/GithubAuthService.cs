using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Identity;

public class GithubAuthService : IGithubAuthService
{
    private readonly HttpClient _httpClient;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly ILogger<GithubAuthService> _logger;

    public GithubAuthService(HttpClient httpClient, IConfiguration configuration, ILogger<GithubAuthService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
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
            _logger.LogInformation("GitHub OAuth: exchanging code for token. ClientId present: {HasId}, ClientSecret present: {HasSecret}",
                !string.IsNullOrEmpty(_clientId), !string.IsNullOrEmpty(_clientSecret));

            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
            {
                Content = JsonContent.Create(new
                {
                    client_id = _clientId,
                    client_secret = _clientSecret,
                    code
                }, options: new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
            };
            tokenRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            tokenRequest.Headers.UserAgent.Add(new ProductInfoHeaderValue("SyncSpace", "1.0"));

            var tokenResponse = await _httpClient.SendAsync(tokenRequest);
            var tokenContent = await tokenResponse.Content.ReadAsStringAsync();

            _logger.LogInformation("GitHub token response status: {Status}", tokenResponse.StatusCode);

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub token exchange failed: {Content}", tokenContent);
                return null;
            }

            var tokenDoc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(tokenContent);

            if (tokenDoc == null || !tokenDoc.TryGetValue("access_token", out var accessTokenElement))
            {
                _logger.LogWarning("No access_token in GitHub response: {Content}", tokenContent);
                return null;
            }

            var accessToken = accessTokenElement.GetString();
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogWarning("GitHub access_token is empty");
                return null;
            }

            var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            userRequest.Headers.UserAgent.Add(new ProductInfoHeaderValue("SyncSpace", "1.0"));
            userRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var userResponse = await _httpClient.SendAsync(userRequest);
            var userJson = await userResponse.Content.ReadAsStringAsync();

            _logger.LogInformation("GitHub user API status: {Status}", userResponse.StatusCode);

            if (!userResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub user API failed: {Content}", userJson);
                return null;
            }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "GitHub OAuth failed");
            return null;
        }
    }
}
