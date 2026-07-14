namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class Message : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public Guid ChannelId { get; set; }
    public Guid SenderId { get; set; }
    public Guid? ThreadId { get; set; }
    public MessageType Type { get; set; } = MessageType.Text;
    public bool IsEdited { get; set; }
    public bool IsPinned { get; set; }
    public Guid? PinnedById { get; set; }
    public DateTime? PinnedAt { get; set; }

    public Channel Channel { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public User? PinnedBy { get; set; }
    public Message? Thread { get; set; }
    public ICollection<Message> Replies { get; set; } = new List<Message>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
    public ICollection<MessageEdit> EditHistory { get; set; } = new List<MessageEdit>();
}

public class MessageReadReceipt : BaseEntity
{
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    public Message Message { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class MessageEdit : BaseEntity
{
    public Guid MessageId { get; set; }
    public string OldContent { get; set; } = string.Empty;
    public string NewContent { get; set; } = string.Empty;
    public Guid EditedById { get; set; }

    public Message Message { get; set; } = null!;
    public User EditedBy { get; set; } = null!;
}
