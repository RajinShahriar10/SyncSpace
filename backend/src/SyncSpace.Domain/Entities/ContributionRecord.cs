using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class ContributionRecord : BaseEntity
{
    public Guid StudentId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? ActivityReferenceId { get; set; }
    public decimal Score { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Guid? ProjectGroupId { get; set; }

    public User Student { get; set; } = null!;
    public Workspace? Workspace { get; set; }
    public ProjectGroup? ProjectGroup { get; set; }
}
