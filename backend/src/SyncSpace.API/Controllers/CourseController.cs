using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController : ControllerBase
{
    private readonly SyncSpaceDbContext _db;

    public CourseController(SyncSpaceDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var courses = await _db.Courses
            .Where(c => c.InstructorId == userId || c.ProjectGroups.Any(g => g.Members.Any(m => m.UserId == userId)))
            .Include(c => c.Instructor)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id, c.CourseCode, c.CourseName, c.Semester, c.InstructorId,
                InstructorName = c.Instructor.FirstName + " " + c.Instructor.LastName,
                GroupCount = c.ProjectGroups.Count
            })
            .ToListAsync();
        return Ok(new { data = courses });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var course = await _db.Courses
            .Include(c => c.Instructor)
            .Include(c => c.ProjectGroups).ThenInclude(g => g.Leader)
            .Include(c => c.ProjectGroups).ThenInclude(g => g.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (course == null) return NotFound();

        return Ok(new
        {
            data = new
            {
                course.Id, course.CourseCode, course.CourseName, course.Semester, course.InstructorId,
                InstructorName = course.Instructor.FirstName + " " + course.Instructor.LastName,
                ProjectGroups = course.ProjectGroups.Select(g => new
                {
                    g.Id, g.GroupName, g.LeaderId,
                    LeaderName = g.Leader.FirstName + " " + g.Leader.LastName,
                    MemberCount = g.Members.Count,
                    WorkspaceCount = g.Workspaces.Count,
                    MilestoneCount = g.Milestones.Count
                })
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var course = new Course
        {
            CourseCode = request.CourseCode,
            CourseName = request.CourseName,
            Semester = request.Semester,
            InstructorId = userId
        };
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = course.Id }, new { data = course });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourseRequest request)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null) return NotFound();

        if (request.CourseName != null) course.CourseName = request.CourseName;
        if (request.CourseCode != null) course.CourseCode = request.CourseCode;
        if (request.Semester != null) course.Semester = request.Semester;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { data = course });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null) return NotFound();
        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
        return Ok(new { data = true });
    }
}

public record CreateCourseRequest(string CourseCode, string CourseName, string Semester);
public record UpdateCourseRequest(string? CourseCode, string? CourseName, string? Semester);
