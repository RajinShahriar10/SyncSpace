namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class WorkspaceMember : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid WorkspaceId { get; set; }
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Editor;

    public User User { get; set; } = null!;
    public Workspace Workspace { get; set; } = null!;
}
