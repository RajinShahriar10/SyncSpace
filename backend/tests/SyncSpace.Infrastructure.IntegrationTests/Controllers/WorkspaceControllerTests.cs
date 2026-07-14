using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class WorkspaceControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public WorkspaceControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetUserWorkspaces_Authenticated_ShouldReturn200()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync("/api/Workspace");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserWorkspaces_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);

        var response = await client.GetAsync("/api/Workspace");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateWorkspace_ValidData_ShouldReturn201()
    {
        var client = _factory.GetHttpClient(authenticated: true);
        var command = new { name = "Test Workspace", description = "A test workspace" };

        var response = await client.PostAsJsonAsync("/api/Workspace", command);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        body.Should().Contain("\"success\":true");
    }

    [Fact]
    public async Task CreateWorkspace_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);
        var command = new { name = "Test Workspace" };

        var response = await client.PostAsJsonAsync("/api/Workspace", command);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetWorkspace_NonExistent_ShouldReturn404()
    {
        var client = _factory.GetHttpClient(authenticated: true);

        var response = await client.GetAsync($"/api/Workspace/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
