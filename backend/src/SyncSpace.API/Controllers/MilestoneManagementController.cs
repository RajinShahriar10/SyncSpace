using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.API.Services;

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
    public async Task<ActionResult<MilestoneDto>> Create([FromBody] Services.CreateMilestoneRequest request)
    {
        try
        {
            var milestone = await _milestoneService.CreateMilestoneAsync(request);
            return Ok(milestone);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MilestoneDto>> Update(Guid id, [FromBody] Services.UpdateMilestoneRequest request)
    {
        try
        {
            var milestone = await _milestoneService.UpdateMilestoneAsync(id, request);
            return Ok(milestone);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _milestoneService.DeleteMilestoneAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MilestoneDto>> GetById(Guid id)
    {
        var milestone = await _milestoneService.GetMilestoneAsync(id);
        return milestone == null ? NotFound() : Ok(milestone);
    }

    [HttpGet("group/{projectGroupId:guid}")]
    public async Task<ActionResult<MilestoneDto[]>> GetByGroup(Guid projectGroupId)
    {
        var milestones = await _milestoneService.GetMilestonesByGroupAsync(projectGroupId);
        return Ok(milestones);
    }

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<MilestoneDto[]>> GetByCourse(Guid courseId)
    {
        var milestones = await _milestoneService.GetMilestonesByCourseAsync(courseId);
        return Ok(milestones);
    }

    [HttpGet("progress/{projectGroupId:guid}")]
    public async Task<ActionResult<MilestoneProgress>> GetProgress(Guid projectGroupId)
    {
        var progress = await _milestoneService.GetMilestoneProgressAsync(projectGroupId);
        return Ok(progress);
    }

    [HttpGet("timeline/{projectGroupId:guid}")]
    public async Task<ActionResult<MilestoneTimelineEntry[]>> GetTimeline(Guid projectGroupId)
    {
        var timeline = await _milestoneService.GetTimelineAsync(projectGroupId);
        return Ok(timeline);
    }

    [HttpGet("history/{projectGroupId:guid}")]
    public async Task<ActionResult<MilestoneHistoryEntry[]>> GetHistory(Guid projectGroupId)
    {
        var history = await _milestoneService.GetHistoryAsync(projectGroupId);
        return Ok(history);
    }

    [HttpPost("{milestoneId:guid}/assign")]
    public async Task<IActionResult> AssignMembers(Guid milestoneId, [FromBody] Guid[] userIds)
    {
        var success = await _milestoneService.AssignMembersAsync(milestoneId, userIds);
        return success ? Ok(new { message = "Members assigned" }) : NotFound();
    }

    [HttpPost("{milestoneId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid milestoneId)
    {
        var success = await _milestoneService.CompleteMilestoneAsync(milestoneId);
        return success ? Ok(new { message = "Milestone completed" }) : NotFound();
    }

    [HttpGet("{milestoneId:guid}/reminders")]
    public async Task<ActionResult<MilestoneReminderDto[]>> GetReminders(Guid milestoneId)
    {
        var reminders = await _milestoneService.GetRemindersAsync(milestoneId);
        return Ok(reminders);
    }

    [HttpPost("{milestoneId:guid}/reminders/generate")]
    public async Task<ActionResult<MilestoneReminderDto[]>> GenerateReminders(Guid milestoneId)
    {
        try
        {
            var reminders = await _milestoneService.GenerateRemindersAsync(milestoneId);
            return Ok(reminders);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("course/{courseId:guid}/summary")]
    public async Task<ActionResult<CourseMilestoneSummary>> GetCourseSummary(Guid courseId)
    {
        var summary = await _milestoneService.GetCourseMilestoneSummaryAsync(courseId);
        return Ok(summary);
    }
}
