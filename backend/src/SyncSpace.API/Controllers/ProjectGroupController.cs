using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectGroupController : ControllerBase
{
    private readonly SyncSpaceDbContext _db;

    public ProjectGroupController(SyncSpaceDbContext db) => _db = db;

    [HttpGet("course/{courseId:guid}")]
    public async Task<IActionResult> GetByCourse(Guid courseId)
    {
        var groups = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Include(g => g.Leader)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Select(g => new
            {
                g.Id, g.GroupName, g.CourseId, g.LeaderId,
                LeaderName = g.Leader.FirstName + " " + g.Leader.LastName,
                MemberCount = g.Members.Count,
                WorkspaceCount = g.Workspaces.Count,
                MilestoneCount = g.Milestones.Count
            })
            .ToListAsync();
        return Ok(new { data = groups });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var group = await _db.ProjectGroups
            .Include(g => g.Course)
            .Include(g => g.Leader)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Workspaces)
            .Include(g => g.Milestones)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();

        return Ok(new
        {
            data = new
            {
                group.Id, group.GroupName, group.CourseId, group.LeaderId,
                CourseName = group.Course.CourseName,
                CourseCode = group.Course.CourseCode,
                LeaderName = group.Leader.FirstName + " " + group.Leader.LastName,
                Members = group.Members.Select(m => new
                {
                    m.UserId,
                    UserName = m.User.FirstName + " " + m.User.LastName,
                    m.User.Email,
                    m.User.AvatarUrl
                }),
                Workspaces = group.Workspaces.Select(w => new
                {
                    w.Id, w.Name, w.Description
                }),
                Milestones = group.Milestones.OrderByDescending(m => m.DueDate).Select(m => new
                {
                    m.Id, m.Title, m.Description, m.DueDate, m.IsCompleted
                })
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var group = new ProjectGroup
        {
            CourseId = request.CourseId,
            GroupName = request.GroupName,
            LeaderId = userId
        };
        _db.ProjectGroups.Add(group);

        var member = new ProjectGroupMember { ProjectGroupId = group.Id, UserId = userId };
        _db.ProjectGroupMembers.Add(member);

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = group.Id }, new { data = group });
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddGroupMemberRequest request)
    {
        var group = await _db.ProjectGroups.FindAsync(id);
        if (group == null) return NotFound();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return BadRequest(new { message = "User not found" });

        var exists = await _db.ProjectGroupMembers.AnyAsync(m => m.ProjectGroupId == id && m.UserId == user.Id);
        if (exists) return BadRequest(new { message = "User already in group" });

        var member = new ProjectGroupMember { ProjectGroupId = id, UserId = user.Id };
        _db.ProjectGroupMembers.Add(member);
        await _db.SaveChangesAsync();
        return Ok(new { data = new { member.Id, member.UserId, member.ProjectGroupId } });
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var member = await _db.ProjectGroupMembers
            .FirstOrDefaultAsync(m => m.ProjectGroupId == id && m.UserId == userId);
        if (member == null) return NotFound();
        _db.ProjectGroupMembers.Remove(member);
        await _db.SaveChangesAsync();
        return Ok(new { data = true });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var group = await _db.ProjectGroups.FindAsync(id);
        if (group == null) return NotFound();
        _db.ProjectGroups.Remove(group);
        await _db.SaveChangesAsync();
        return Ok(new { data = true });
    }
}

public record CreateGroupRequest(Guid CourseId, string GroupName);
public record AddGroupMemberRequest(string Email);
