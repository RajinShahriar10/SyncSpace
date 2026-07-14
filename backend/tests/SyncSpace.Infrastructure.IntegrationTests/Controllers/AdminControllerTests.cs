using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class AdminControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AdminControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetOverview_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Admin/overview");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task GetUsers_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Admin/users");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task GetSystemHealth_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Admin/health");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task GetStorage_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Admin/storage");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
