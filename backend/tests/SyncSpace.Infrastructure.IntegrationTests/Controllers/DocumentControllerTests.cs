using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class DocumentControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public DocumentControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetByWorkspace_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);
        var workspaceId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/Document/workspace/{workspaceId}");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task CreateDocument_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var command = new { title = "Test Doc", workspaceId = Guid.NewGuid() };

        var response = await client.PostAsJsonAsync("/api/Document", command);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDocument_NonExistent_ShouldReturn404()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync($"/api/Document/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
