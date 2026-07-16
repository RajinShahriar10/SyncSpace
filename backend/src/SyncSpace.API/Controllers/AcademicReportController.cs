using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;
using SyncSpace.Application.Common.Models;

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

    [HttpGet("student/{userId}")]
    public async Task<ActionResult<ApiResponse<StudentReportDto>>> GetStudentReport(string userId, [FromQuery] Guid? courseId = null)
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return NotFound(ApiResponse<StudentReportDto>.NotFound("Invalid user ID format."));

        try
        {
            var report = await _reportService.GetStudentReportAsync(userGuid, courseId);
            return Ok(ApiResponse<StudentReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<StudentReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("student/{userId}/activity-trend")]
    public async Task<ActionResult<ApiResponse<StudentActivityTrendDto[]>>> GetStudentActivityTrend(string userId, [FromQuery] int weeks = 12)
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return NotFound(ApiResponse<StudentActivityTrendDto[]>.NotFound("Invalid user ID format."));

        var trend = await _reportService.GetStudentActivityTrendAsync(userGuid, weeks);
        return Ok(ApiResponse<StudentActivityTrendDto[]>.SuccessResponse(trend));
    }

    [HttpGet("group/{projectGroupId}")]
    public async Task<ActionResult<ApiResponse<GroupReportDto>>> GetGroupReport(string projectGroupId)
    {
        if (!Guid.TryParse(projectGroupId, out var groupGuid))
            return NotFound(ApiResponse<GroupReportDto>.NotFound("Invalid group ID format."));

        try
        {
            var report = await _reportService.GetGroupReportAsync(groupGuid);
            return Ok(ApiResponse<GroupReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<GroupReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("instructor/{courseId}")]
    public async Task<ActionResult<ApiResponse<InstructorReportDto>>> GetInstructorReport(string courseId)
    {
        if (!Guid.TryParse(courseId, out var courseGuid))
            return NotFound(ApiResponse<InstructorReportDto>.NotFound("Invalid course ID format."));

        try
        {
            var report = await _reportService.GetInstructorReportAsync(courseGuid);
            return Ok(ApiResponse<InstructorReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<InstructorReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("semester/{courseId}")]
    public async Task<ActionResult<ApiResponse<SemesterSummaryDto>>> GetSemesterSummary(string courseId)
    {
        if (!Guid.TryParse(courseId, out var courseGuid))
            return NotFound(ApiResponse<SemesterSummaryDto>.NotFound("Invalid course ID format."));

        try
        {
            var summary = await _reportService.GetSemesterSummaryAsync(courseGuid);
            return Ok(ApiResponse<SemesterSummaryDto>.SuccessResponse(summary));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<SemesterSummaryDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("rankings/{courseId}")]
    public async Task<ActionResult<ApiResponse<GroupRankingDto[]>>> GetGroupRankings(string courseId)
    {
        if (!Guid.TryParse(courseId, out var courseGuid))
            return NotFound(ApiResponse<GroupRankingDto[]>.NotFound("Invalid course ID format."));

        var rankings = await _reportService.GetGroupRankingsAsync(courseGuid);
        return Ok(ApiResponse<GroupRankingDto[]>.SuccessResponse(rankings));
    }

    [HttpGet("stats/{courseId}")]
    public async Task<ActionResult<ApiResponse<CourseStatsDto>>> GetCourseStats(string courseId)
    {
        if (!Guid.TryParse(courseId, out var courseGuid))
            return NotFound(ApiResponse<CourseStatsDto>.NotFound("Invalid course ID format."));

        var stats = await _reportService.GetCourseStatsAsync(courseGuid);
        return Ok(ApiResponse<CourseStatsDto>.SuccessResponse(stats));
    }
}
