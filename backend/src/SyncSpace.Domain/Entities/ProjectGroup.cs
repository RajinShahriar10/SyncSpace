using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class ProjectGroup : BaseEntity
{
    public Guid CourseId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public Guid LeaderId { get; set; }

    public Course Course { get; set; } = null!;
    public User Leader { get; set; } = null!;
    public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
    public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
    public ICollection<ProjectGroupMember> Members { get; set; } = new List<ProjectGroupMember>();
}

public class ProjectGroupMember : BaseEntity
{
    public Guid ProjectGroupId { get; set; }
    public Guid UserId { get; set; }

    public ProjectGroup ProjectGroup { get; set; } = null!;
    public User User { get; set; } = null!;
}
