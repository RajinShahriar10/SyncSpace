using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;
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
    public async Task<ActionResult<RiskDashboardDto>> GetDashboard([FromQuery] Guid? courseId = null)
    {
        var dashboard = await _riskService.GetDashboardAsync(courseId);
        return Ok(dashboard);
    }

    [HttpGet("assessments")]
    public async Task<ActionResult<RiskAssessmentDto[]>> GetAssessments(
        [FromQuery] Guid? courseId = null,
        [FromQuery] RiskLevel? riskLevel = null)
    {
        var assessments = await _riskService.GetAllAssessmentsAsync(courseId, riskLevel);
        return Ok(assessments);
    }

    [HttpPost("assess/{projectGroupId:guid}")]
    public async Task<ActionResult<RiskAssessmentDto>> AssessGroup(Guid projectGroupId)
    {
        try
        {
            var assessment = await _riskService.AssessGroupRiskAsync(projectGroupId);
            return Ok(assessment);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<RiskAlertDto[]>> GetAlerts(
        [FromQuery] Guid? courseId = null,
        [FromQuery] RiskLevel? severity = null,
        [FromQuery] bool? acknowledged = null)
    {
        var alerts = await _riskService.GetAlertsAsync(courseId, severity, acknowledged);
        return Ok(alerts);
    }

    [HttpPost("alerts/{alertId:guid}/acknowledge")]
    public async Task<IActionResult> AcknowledgeAlert(Guid alertId, [FromQuery] Guid userId)
    {
        var success = await _riskService.AcknowledgeAlertAsync(alertId, userId);
        return success ? Ok(new { message = "Alert acknowledged" }) : NotFound();
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<GroupRiskDetailDto>> GetGroupDetail(Guid projectGroupId)
    {
        try
        {
            var detail = await _riskService.GetGroupDetailAsync(projectGroupId);
            return Ok(detail);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("auto-refresh")]
    public async Task<ActionResult<AutoRefreshPayload>> GetAutoRefresh([FromQuery] DateTime? since = null)
    {
        var payload = await _riskService.GetAutoRefreshAsync(since);
        return Ok(payload);
    }
}
