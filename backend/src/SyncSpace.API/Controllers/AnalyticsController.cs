using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("workspace/{workspaceId:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspaceOverview(Guid workspaceId, CancellationToken ct)
    {
        var result = await _analyticsService.GetWorkspaceOverviewAsync(workspaceId, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("workspace/{workspaceId:guid}/growth")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrowth(
        Guid workspaceId,
        [FromQuery] int months = 6,
        CancellationToken ct = default)
    {
        var result = await _analyticsService.GetWorkspaceGrowthAsync(workspaceId, months, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("workspace/{workspaceId:guid}/members/top")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopMembers(
        Guid workspaceId,
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        var result = await _analyticsService.GetTopMembersAsync(workspaceId, limit, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("workspace/{workspaceId:guid}/tasks/status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTaskStatus(Guid workspaceId, CancellationToken ct)
    {
        var result = await _analyticsService.GetTaskStatusAsync(workspaceId, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("workspace/{workspaceId:guid}/documents/timeline")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocumentTimeline(
        Guid workspaceId,
        [FromQuery] int months = 6,
        CancellationToken ct = default)
    {
        var result = await _analyticsService.GetDocumentCreationAsync(workspaceId, months, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("workspace/{workspaceId:guid}/messages/timeline")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessageTimeline(
        Guid workspaceId,
        [FromQuery] int months = 6,
        CancellationToken ct = default)
    {
        var result = await _analyticsService.GetMessageActivityAsync(workspaceId, months, ct);
        return Ok(new { success = true, data = result });
    }
}
