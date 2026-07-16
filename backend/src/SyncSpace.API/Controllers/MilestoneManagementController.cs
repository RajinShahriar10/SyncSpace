using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;
using SyncSpace.Application.Common.Models;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/milestone-management")]
[Authorize]
public class MilestoneManagementController : ControllerBase
{
    private readonly IMilestoneService _milestoneService;

    public MilestoneManagementController(IMilestoneService milestoneService)
    {
        _milestoneService = milestoneService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<MilestoneDto>>> Create([FromBody] Services.CreateMilestoneRequest request)
    {
        try
        {
            var milestone = await _milestoneService.CreateMilestoneAsync(request);
            return Ok(ApiResponse<MilestoneDto>.SuccessResponse(milestone));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<MilestoneDto>.Failure(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneDto>>> Update(Guid id, [FromBody] Services.UpdateMilestoneRequest request)
    {
        try
        {
            var milestone = await _milestoneService.UpdateMilestoneAsync(id, request);
            return Ok(ApiResponse<MilestoneDto>.SuccessResponse(milestone));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<MilestoneDto>.NotFound(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _milestoneService.DeleteMilestoneAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneDto>>> GetById(Guid id)
    {
        var milestone = await _milestoneService.GetMilestoneAsync(id);
        return milestone == null
            ? NotFound(ApiResponse<MilestoneDto>.NotFound())
            : Ok(ApiResponse<MilestoneDto>.SuccessResponse(milestone));
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneDto[]>>> GetByGroup(Guid projectGroupId)
    {
        var milestones = await _milestoneService.GetMilestonesByGroupAsync(projectGroupId);
        return Ok(ApiResponse<MilestoneDto[]>.SuccessResponse(milestones));
    }

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneDto[]>>> GetByCourse(Guid courseId)
    {
        var milestones = await _milestoneService.GetMilestonesByCourseAsync(courseId);
        return Ok(ApiResponse<MilestoneDto[]>.SuccessResponse(milestones));
    }

    [HttpGet("progress/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneProgress>>> GetProgress(Guid projectGroupId)
    {
        var progress = await _milestoneService.GetMilestoneProgressAsync(projectGroupId);
        return Ok(ApiResponse<MilestoneProgress>.SuccessResponse(progress));
    }

    [HttpGet("timeline/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneTimelineEntry[]>>> GetTimeline(Guid projectGroupId)
    {
        var timeline = await _milestoneService.GetTimelineAsync(projectGroupId);
        return Ok(ApiResponse<MilestoneTimelineEntry[]>.SuccessResponse(timeline));
    }

    [HttpGet("history/{projectGroupId:guid}")]
    public async Task<ActionResult<ApiResponse<MilestoneHistoryEntry[]>>> GetHistory(Guid projectGroupId)
    {
        var history = await _milestoneService.GetHistoryAsync(projectGroupId);
        return Ok(ApiResponse<MilestoneHistoryEntry[]>.SuccessResponse(history));
    }

    [HttpPost("{milestoneId:guid}/assign")]
    public async Task<IActionResult> AssignMembers(Guid milestoneId, [FromBody] Guid[] userIds)
    {
        var success = await _milestoneService.AssignMembersAsync(milestoneId, userIds);
        return success ? Ok(ApiResponse<object>.SuccessResponse(new { message = "Members assigned" })) : NotFound();
    }

    [HttpPost("{milestoneId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid milestoneId)
    {
        var success = await _milestoneService.CompleteMilestoneAsync(milestoneId);
        return success ? Ok(ApiResponse<object>.SuccessResponse(new { message = "Milestone completed" })) : NotFound();
    }

    [HttpGet("{milestoneId:guid}/reminders")]
    public async Task<ActionResult<ApiResponse<MilestoneReminderDto[]>>> GetReminders(Guid milestoneId)
    {
        var reminders = await _milestoneService.GetRemindersAsync(milestoneId);
        return Ok(ApiResponse<MilestoneReminderDto[]>.SuccessResponse(reminders));
    }

    [HttpPost("{milestoneId:guid}/reminders/generate")]
    public async Task<ActionResult<ApiResponse<MilestoneReminderDto[]>>> GenerateReminders(Guid milestoneId)
    {
        try
        {
            var reminders = await _milestoneService.GenerateRemindersAsync(milestoneId);
            return Ok(ApiResponse<MilestoneReminderDto[]>.SuccessResponse(reminders));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<MilestoneReminderDto[]>.NotFound(ex.Message));
        }
    }

    [HttpGet("course/{courseId:guid}/summary")]
    public async Task<ActionResult<ApiResponse<CourseMilestoneSummary>>> GetCourseSummary(Guid courseId)
    {
        var summary = await _milestoneService.GetCourseMilestoneSummaryAsync(courseId);
        return Ok(ApiResponse<CourseMilestoneSummary>.SuccessResponse(summary));
    }
}
