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

    [HttpGet("student/{userId:guid}")]
    public async Task<ActionResult<ApiResponse<StudentReportDto>>> GetStudentReport(Guid userId, [FromQuery] Guid? courseId = null)
    {
        try
        {
            var report = await _reportService.GetStudentReportAsync(userId, courseId);
            return Ok(ApiResponse<StudentReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<StudentReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("student/{userId:guid}/activity-trend")]
    public async Task<ActionResult<ApiResponse<StudentActivityTrendDto[]>>> GetStudentActivityTrend(Guid userId, [FromQuery] int weeks = 12)
    {
        var trend = await _reportService.GetStudentActivityTrendAsync(userId, weeks);
        return Ok(ApiResponse<StudentActivityTrendDto[]>.SuccessResponse(trend));
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<GroupReportDto>>> GetGroupReport(Guid projectGroupId)
    {
        try
        {
            var report = await _reportService.GetGroupReportAsync(projectGroupId);
            return Ok(ApiResponse<GroupReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<GroupReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("instructor/{courseId:guid}")]
    public async Task<ActionResult<ApiResponse<InstructorReportDto>>> GetInstructorReport(Guid courseId)
    {
        try
        {
            var report = await _reportService.GetInstructorReportAsync(courseId);
            return Ok(ApiResponse<InstructorReportDto>.SuccessResponse(report));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<InstructorReportDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("semester/{courseId:guid}")]
    public async Task<ActionResult<ApiResponse<SemesterSummaryDto>>> GetSemesterSummary(Guid courseId)
    {
        try
        {
            var summary = await _reportService.GetSemesterSummaryAsync(courseId);
            return Ok(ApiResponse<SemesterSummaryDto>.SuccessResponse(summary));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<SemesterSummaryDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("rankings/{courseId:guid}")]
    public async Task<ActionResult<ApiResponse<GroupRankingDto[]>>> GetGroupRankings(Guid courseId)
    {
        var rankings = await _reportService.GetGroupRankingsAsync(courseId);
        return Ok(ApiResponse<GroupRankingDto[]>.SuccessResponse(rankings));
    }

    [HttpGet("stats/{courseId:guid}")]
    public async Task<ActionResult<ApiResponse<CourseStatsDto>>> GetCourseStats(Guid courseId)
    {
        var stats = await _reportService.GetCourseStatsAsync(courseId);
        return Ok(ApiResponse<CourseStatsDto>.SuccessResponse(stats));
    }
}
