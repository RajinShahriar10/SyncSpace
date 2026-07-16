using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;
using SyncSpace.Application.Common.Models;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/risk")]
[Authorize]
public class RiskDashboardController : ControllerBase
{
    private readonly IRiskDetectionService _riskService;

    public RiskDashboardController(IRiskDetectionService riskService)
    {
        _riskService = riskService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<RiskDashboardDto>>> GetDashboard([FromQuery] Guid? courseId = null)
    {
        var dashboard = await _riskService.GetDashboardAsync(courseId);
        return Ok(ApiResponse<RiskDashboardDto>.SuccessResponse(dashboard));
    }

    [HttpGet("assessments")]
    public async Task<ActionResult<ApiResponse<RiskAssessmentDto[]>>> GetAssessments(
        [FromQuery] Guid? courseId = null,
        [FromQuery] RiskLevel? riskLevel = null)
    {
        var assessments = await _riskService.GetAllAssessmentsAsync(courseId, riskLevel);
        return Ok(ApiResponse<RiskAssessmentDto[]>.SuccessResponse(assessments));
    }

    [HttpPost("assess/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<RiskAssessmentDto>>> AssessGroup(Guid projectGroupId)
    {
        try
        {
            var assessment = await _riskService.AssessGroupRiskAsync(projectGroupId);
            return Ok(ApiResponse<RiskAssessmentDto>.SuccessResponse(assessment));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<RiskAssessmentDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<RiskAlertDto[]>>> GetAlerts(
        [FromQuery] Guid? courseId = null,
        [FromQuery] RiskLevel? severity = null,
        [FromQuery] bool? acknowledged = null)
    {
        var alerts = await _riskService.GetAlertsAsync(courseId, severity, acknowledged);
        return Ok(ApiResponse<RiskAlertDto[]>.SuccessResponse(alerts));
    }

    [HttpPost("alerts/{alertId:guid}/acknowledge")]
    public async Task<IActionResult> AcknowledgeAlert(Guid alertId, [FromQuery] Guid userId)
    {
        var success = await _riskService.AcknowledgeAlertAsync(alertId, userId);
        return success ? Ok(ApiResponse<object>.SuccessResponse(new { message = "Alert acknowledged" })) : NotFound();
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<GroupRiskDetailDto>>> GetGroupDetail(Guid projectGroupId)
    {
        try
        {
            var detail = await _riskService.GetGroupDetailAsync(projectGroupId);
            return Ok(ApiResponse<GroupRiskDetailDto>.SuccessResponse(detail));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<GroupRiskDetailDto>.NotFound(ex.Message));
        }
    }

    [HttpGet("auto-refresh")]
    public async Task<ActionResult<ApiResponse<AutoRefreshPayload>>> GetAutoRefresh([FromQuery] DateTime? since = null)
    {
        var payload = await _riskService.GetAutoRefreshAsync(since);
        return Ok(ApiResponse<AutoRefreshPayload>.SuccessResponse(payload));
    }
}
