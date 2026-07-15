namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class User : BaseEntity
{
    public string IdentityId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public AcademicRole? AcademicRole { get; set; }

    public ICollection<WorkspaceMember> WorkspaceMembers { get; set; } = new List<WorkspaceMember>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Course> TaughtCourses { get; set; } = new List<Course>();
    public ICollection<ProjectGroup> LedGroups { get; set; } = new List<ProjectGroup>();

    public string FullName => $"{FirstName} {LastName}";
}
