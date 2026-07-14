using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class AuthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AuthControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_ValidData_ShouldReturn200WithTokens()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var command = new
        {
            email = $"user{Guid.NewGuid():N}@test.com",
            password = "Password123!",
            confirmPassword = "Password123!",
            firstName = "Test",
            lastName = "User"
        };

        var response = await client.PostAsJsonAsync("/api/Auth/register", command);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"accessToken\"");
        body.Should().Contain("\"refreshToken\"");
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ShouldReturn400()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var email = $"dup{Guid.NewGuid():N}@test.com";
        var command = new
        {
            email,
            password = "Password123!",
            confirmPassword = "Password123!",
            firstName = "Test",
            lastName = "User"
        };

        await client.PostAsJsonAsync("/api/Auth/register", command);
        var response = await client.PostAsJsonAsync("/api/Auth/register", command);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_InvalidData_ShouldReturn400()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var command = new { email = "bad", password = "1", confirmPassword = "2", firstName = "", lastName = "" };

        var response = await client.PostAsJsonAsync("/api/Auth/register", command);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidCredentials_ShouldReturn200WithTokens()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var email = $"login{Guid.NewGuid():N}@test.com";
        var registerCmd = new
        {
            email,
            password = "Password123!",
            confirmPassword = "Password123!",
            firstName = "Test",
            lastName = "User"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerCmd);

        var loginCmd = new { email, password = "Password123!" };
        var response = await client.PostAsJsonAsync("/api/Auth/login", loginCmd);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"accessToken\"");
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task Login_InvalidCredentials_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var loginCmd = new { email = "nonexistent@test.com", password = "WrongPass123!" };

        var response = await client.PostAsJsonAsync("/api/Auth/login", loginCmd);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_Authenticated_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Auth/me");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"email\"");
        body.Should().Contain("\"firstName\"");
    }

    [Fact]
    public async Task GetCurrentUser_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);

        var response = await client.GetAsync("/api/Auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
