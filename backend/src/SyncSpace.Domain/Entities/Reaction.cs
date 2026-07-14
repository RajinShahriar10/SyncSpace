namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Reaction : BaseEntity
{
    public string Emoji { get; set; } = string.Empty;
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }

    public Message Message { get; set; } = null!;
    public User User { get; set; } = null!;
}
