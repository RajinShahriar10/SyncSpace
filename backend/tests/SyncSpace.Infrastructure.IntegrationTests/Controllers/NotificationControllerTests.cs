using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class NotificationControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public NotificationControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetNotifications_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);
        var userId = TestWebApplicationFactory.TestUserId;

        var response = await client.GetAsync($"/api/Notification?userId={userId}");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task GetNotifications_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var userId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/Notification?userId={userId}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
