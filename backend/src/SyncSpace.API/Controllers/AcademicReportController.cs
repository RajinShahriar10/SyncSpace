using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class AcademicReportController : ControllerBase
{
    private readonly IAcademicReportService _reportService;

    public AcademicReportController(IAcademicReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("student/{userId:guid}")]
    public async Task<ActionResult<StudentReportDto>> GetStudentReport(Guid userId, [FromQuery] Guid? courseId = null)
    {
        try
        {
            var report = await _reportService.GetStudentReportAsync(userId, courseId);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("student/{userId:guid}/activity-trend")]
    public async Task<ActionResult<StudentActivityTrendDto[]>> GetStudentActivityTrend(Guid userId, [FromQuery] int weeks = 12)
    {
        var trend = await _reportService.GetStudentActivityTrendAsync(userId, weeks);
        return Ok(trend);
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<GroupReportDto>> GetGroupReport(Guid projectGroupId)
    {
        try
        {
            var report = await _reportService.GetGroupReportAsync(projectGroupId);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("instructor/{courseId:guid}")]
    public async Task<ActionResult<InstructorReportDto>> GetInstructorReport(Guid courseId)
    {
        try
        {
            var report = await _reportService.GetInstructorReportAsync(courseId);
            return Ok(report);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("semester/{courseId:guid}")]
    public async Task<ActionResult<SemesterSummaryDto>> GetSemesterSummary(Guid courseId)
    {
        try
        {
            var summary = await _reportService.GetSemesterSummaryAsync(courseId);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("rankings/{courseId:guid}")]
    public async Task<ActionResult<GroupRankingDto[]>> GetGroupRankings(Guid courseId)
    {
        var rankings = await _reportService.GetGroupRankingsAsync(courseId);
        return Ok(rankings);
    }

    [HttpGet("stats/{courseId:guid}")]
    public async Task<ActionResult<CourseStatsDto>> GetCourseStats(Guid courseId)
    {
        var stats = await _reportService.GetCourseStatsAsync(courseId);
        return Ok(stats);
    }
}
