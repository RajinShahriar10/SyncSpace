using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace SyncSpace.Infrastructure.IntegrationTests.Controllers;

public class SearchControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public SearchControllerTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Search_ShortQuery_ShouldReturn200WithEmpty()
    {
        var client = _factory.GetHttpClient(authenticated: true);
        var workspaceId = Guid.NewGuid();

        var response = await client.GetAsync($"/api/Search?q=ab&workspaceId={workspaceId}");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("\"totalCount\":0");
    }

    [Fact]
    public async Task Search_Unauthenticated_ShouldReturn401()
    {
        var client = _factory.GetHttpClient(authenticated: false);

        var response = await client.GetAsync($"/api/Search?q=test&workspaceId={Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
