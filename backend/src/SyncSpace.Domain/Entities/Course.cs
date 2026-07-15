using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class Course : BaseEntity
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public Guid InstructorId { get; set; }

    public User Instructor { get; set; } = null!;
    public ICollection<ProjectGroup> ProjectGroups { get; set; } = new List<ProjectGroup>();
}
