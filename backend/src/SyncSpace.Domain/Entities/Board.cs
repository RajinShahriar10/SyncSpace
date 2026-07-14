namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Board : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid AuthorId { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User Author { get; set; } = null!;
    public ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
}
