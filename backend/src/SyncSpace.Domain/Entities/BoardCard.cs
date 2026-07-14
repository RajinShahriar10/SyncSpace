namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

public class BoardCard : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid ColumnId { get; set; }
    public int Order { get; set; }
    public Guid? AssigneeId { get; set; }
    public DateTime? DueDate { get; set; }
    public CardPriority Priority { get; set; } = CardPriority.None;

    public BoardColumn Column { get; set; } = null!;
    public User? Assignee { get; set; }
    public ICollection<CardLabel> Labels { get; set; } = new List<CardLabel>();
    public ICollection<BoardCardComment> Comments { get; set; } = new List<BoardCardComment>();
    public ICollection<BoardCardAttachment> Attachments { get; set; } = new List<BoardCardAttachment>();
}

public class BoardCardComment : BaseEntity
{
    public Guid CardId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;

    public BoardCard Card { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class BoardCardAttachment : BaseEntity
{
    public Guid CardId { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long Size { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public Guid UploadedById { get; set; }

    public BoardCard Card { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}

public class BoardActivity : BaseEntity
{
    public Guid BoardId { get; set; }
    public Guid? CardId { get; set; }
    public Guid UserId { get; set; }
    public ActivityType ActivityType { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    public Board Board { get; set; } = null!;
    public BoardCard? Card { get; set; }
    public User User { get; set; } = null!;
}
