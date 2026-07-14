using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class DocumentVersion : BaseEntity
{
    public Guid DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Title { get; set; }
    public Guid? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public int VersionNumber { get; set; }
    public string? ChangeDescription { get; set; }

    public Document Document { get; set; } = null!;
}

public class DocumentComment : BaseEntity
{
    public Guid DocumentId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int? PositionStart { get; set; }
    public int? PositionEnd { get; set; }
    public string? SelectedText { get; set; }
    public bool IsResolved { get; set; }
    public Guid? ParentCommentId { get; set; }

    public Document Document { get; set; } = null!;
    public User User { get; set; } = null!;
    public DocumentComment? ParentComment { get; set; }
    public ICollection<DocumentComment> Replies { get; set; } = new List<DocumentComment>();
    public ICollection<DocumentCommentReaction> Reactions { get; set; } = new List<DocumentCommentReaction>();
}

public class DocumentCommentReaction : BaseEntity
{
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public string Emoji { get; set; } = string.Empty;

    public DocumentComment Comment { get; set; } = null!;
    public User User { get; set; } = null!;
}
