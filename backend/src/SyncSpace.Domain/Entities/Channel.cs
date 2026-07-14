namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class Channel : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid WorkspaceId { get; set; }
    public bool IsPrivate { get; set; }
    public Guid? CreatedById { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User? CreatedBy { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<ChannelMember> Members { get; set; } = new List<ChannelMember>();
}

public class ChannelMember : BaseEntity
{
    public Guid ChannelId { get; set; }
    public Guid UserId { get; set; }
    public ChannelMemberRole Role { get; set; } = ChannelMemberRole.Member;
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
    public bool IsMuted { get; set; }

    public Channel Channel { get; set; } = null!;
    public User User { get; set; } = null!;
}
