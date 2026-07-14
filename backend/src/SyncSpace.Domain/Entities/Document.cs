namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Document : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid WorkspaceId { get; set; }
    public Guid AuthorId { get; set; }
    public bool IsPublished { get; set; }
    public int Order { get; set; }
    public string? FolderPath { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User Author { get; set; } = null!;
}
