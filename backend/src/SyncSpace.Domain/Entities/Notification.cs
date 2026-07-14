namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class Notification : BaseEntity
{
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }

    public User User { get; set; } = null!;
}
