using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid UserId { get; set; }
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public Guid? WorkspaceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public User User { get; set; } = null!;
}
