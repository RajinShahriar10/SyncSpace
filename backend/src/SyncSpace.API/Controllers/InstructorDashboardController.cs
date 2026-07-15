using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InstructorDashboardController : ControllerBase
{
    private readonly IInstructorDashboardService _dashboardService;

    public InstructorDashboardController(IInstructorDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    [HttpGet("course/{courseId:guid}/overview")]
    public async Task<IActionResult> GetCourseOverview(Guid courseId)
    {
        try
        {
            var overview = await _dashboardService.GetCourseOverviewAsync(courseId, GetCurrentUserId());
            return Ok(new { data = overview });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("course/{courseId:guid}/groups")]
    public async Task<IActionResult> GetGroupMonitoring(Guid courseId)
    {
        var groups = await _dashboardService.GetGroupMonitoringAsync(courseId);
        return Ok(new { data = groups });
    }

    [HttpGet("group/{groupId:guid}/health")]
    public async Task<IActionResult> GetGroupHealthScore(Guid groupId)
    {
        try
        {
            var health = await _dashboardService.GetGroupHealthScoreAsync(groupId);
            return Ok(new { data = health });
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    [HttpGet("course/{courseId:guid}/contributions")]
    public async Task<IActionResult> GetContributionMonitoring(Guid courseId)
    {
        var contributions = await _dashboardService.GetContributionMonitoringAsync(courseId);
        return Ok(new { data = contributions });
    }

    [HttpGet("course/{courseId:guid}/timeline")]
    public async Task<IActionResult> GetActivityTimeline(Guid courseId, [FromQuery] int days = 30)
    {
        var timeline = await _dashboardService.GetActivityTimelineAsync(courseId, days);
        return Ok(new { data = timeline });
    }

    [HttpGet("course/{courseId:guid}/heatmap")]
    public async Task<IActionResult> GetParticipationHeatmap(Guid courseId)
    {
        var heatmap = await _dashboardService.GetParticipationHeatmapAsync(courseId);
        return Ok(new { data = heatmap });
    }
}
