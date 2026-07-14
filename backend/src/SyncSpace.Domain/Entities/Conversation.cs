namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Conversation : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Guid User1Id { get; set; }
    public Guid User2Id { get; set; }
    public DateTime LastMessageAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User User1 { get; set; } = null!;
    public User User2 { get; set; } = null!;
    public ICollection<DirectMessage> Messages { get; set; } = new List<DirectMessage>();
}

public class DirectMessage : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsEdited { get; set; }
    public Guid? ReplyToId { get; set; }

    public Conversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public DirectMessage? ReplyTo { get; set; }
    public ICollection<DirectMessageReaction> Reactions { get; set; } = new List<DirectMessageReaction>();
    public ICollection<DirectMessageReadReceipt> ReadReceipts { get; set; } = new List<DirectMessageReadReceipt>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}

public class DirectMessageReaction : BaseEntity
{
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }
    public string Emoji { get; set; } = string.Empty;

    public DirectMessage Message { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class DirectMessageReadReceipt : BaseEntity
{
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    public DirectMessage Message { get; set; } = null!;
    public User User { get; set; } = null!;
}
