using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContributionController : ControllerBase
{
    private readonly IContributionEngine _engine;

    public ContributionController(IContributionEngine engine) => _engine = engine;

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    [HttpPost("record")]
    public async Task<IActionResult> RecordActivity([FromBody] RecordActivityRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty) return Unauthorized();

        if (!Enum.TryParse<ContributionActivity>(request.ActivityType, out var activity))
            return BadRequest(new { error = "Invalid activity type" });

        await _engine.RecordActivityAsync(
            userId,
            activity,
            request.ReferenceId,
            request.WorkspaceId,
            request.ProjectGroupId);

        return Ok(new { data = true });
    }

    [HttpGet("summary/{studentId:guid}")]
    public async Task<IActionResult> GetSummary(Guid studentId, [FromQuery] Guid? projectGroupId)
    {
        var summary = await _engine.GetSummaryAsync(studentId, projectGroupId);
        return Ok(new { data = summary });
    }

    [HttpGet("leaderboard/{projectGroupId:guid}")]
    public async Task<IActionResult> GetLeaderboard(Guid projectGroupId)
    {
        var leaderboard = await _engine.GetLeaderboardAsync(projectGroupId);
        return Ok(new { data = leaderboard });
    }

    [HttpGet("weekly/{projectGroupId:guid}")]
    public async Task<IActionResult> GetWeeklyActivity(Guid projectGroupId, [FromQuery] int weeks = 4)
    {
        var activity = await _engine.GetWeeklyActivityAsync(projectGroupId, weeks);
        return Ok(new { data = activity });
    }

    [HttpGet("breakdown/{studentId:guid}")]
    public async Task<IActionResult> GetBreakdown(Guid studentId, [FromQuery] Guid? projectGroupId)
    {
        var breakdown = await _engine.GetBreakdownAsync(studentId, projectGroupId);
        return Ok(new { data = breakdown });
    }

    [HttpGet("leaderboard/group/{projectGroupId:guid}/top")]
    public async Task<IActionResult> GetTopContributors(Guid projectGroupId, [FromQuery] int limit = 3)
    {
        var leaderboard = await _engine.GetLeaderboardAsync(projectGroupId);
        return Ok(new { data = leaderboard.Take(limit).ToArray() });
    }
}

public record RecordActivityRequest(
    string ActivityType,
    string? ReferenceId,
    Guid? WorkspaceId,
    Guid? ProjectGroupId
);
