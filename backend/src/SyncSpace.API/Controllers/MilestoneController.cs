using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MilestoneController : ControllerBase
{
    private readonly SyncSpaceDbContext _db;

    public MilestoneController(SyncSpaceDbContext db) => _db = db;

    [HttpGet("group/{groupId:guid}")]
    public async Task<IActionResult> GetByGroup(Guid groupId)
    {
        var milestones = await _db.Milestones
            .Where(m => m.ProjectGroupId == groupId)
            .OrderBy(m => m.DueDate)
            .Select(m => new
            {
                m.Id, m.Title, m.Description, m.DueDate, m.IsCompleted, m.ProjectGroupId
            })
            .ToListAsync();
        return Ok(new { data = milestones });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMilestoneRequest request)
    {
        var milestone = new Milestone
        {
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            ProjectGroupId = request.ProjectGroupId
        };
        _db.Milestones.Add(milestone);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = milestone.Id }, new { data = milestone });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var milestone = await _db.Milestones.FindAsync(id);
        if (milestone == null) return NotFound();
        return Ok(new { data = milestone });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMilestoneRequest request)
    {
        var milestone = await _db.Milestones.FindAsync(id);
        if (milestone == null) return NotFound();

        if (request.Title != null) milestone.Title = request.Title;
        if (request.Description != null) milestone.Description = request.Description;
        if (request.DueDate.HasValue) milestone.DueDate = request.DueDate.Value;
        if (request.IsCompleted.HasValue) milestone.IsCompleted = request.IsCompleted.Value;
        milestone.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { data = milestone });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var milestone = await _db.Milestones.FindAsync(id);
        if (milestone == null) return NotFound();
        _db.Milestones.Remove(milestone);
        await _db.SaveChangesAsync();
        return Ok(new { data = true });
    }
}

public record CreateMilestoneRequest(string Title, string? Description, DateTime DueDate, Guid ProjectGroupId);
public record UpdateMilestoneRequest(string? Title, string? Description, DateTime? DueDate, bool? IsCompleted);
