namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Workspace : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public Guid OwnerId { get; set; }
    public string Plan { get; set; } = "free";

    public User Owner { get; set; } = null!;
    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
    public ICollection<Channel> Channels { get; set; } = new List<Channel>();
}
