using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ICurrentUserService _currentUser;

    public SearchController(ISearchService searchService, ICurrentUserService currentUser)
    {
        _searchService = searchService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] Guid workspaceId,
        [FromQuery] string? category = null,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
        {
            return Ok(new { success = true, data = new { query = q, totalCount = 0, categories = Array.Empty<object>(), elapsedMs = 0 } });
        }

        if (_currentUser.UserId is null)
            return Unauthorized(new { success = false, message = "Unauthorized" });

        var result = await _searchService.SearchAsync(new Application.Features.Search.DTOs.SearchRequest
        {
            Query = q.Trim(),
            WorkspaceId = workspaceId,
            UserId = _currentUser.UserId.Value,
            Limit = Math.Clamp(limit, 1, 50),
            Category = category
        }, ct);

        return Ok(new { success = true, data = result });
    }
}
