using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class BoardControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public BoardControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetByWorkspace_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);
        var workspaceId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/Board/workspace/{workspaceId}");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task CreateBoard_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var command = new { name = "Test Board", workspaceId = Guid.NewGuid() };

        var response = await client.PostAsJsonAsync("/api/Board", command);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetBoard_NonExistent_ShouldReturn404()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync($"/api/Board/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
