using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class Milestone : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public Guid ProjectGroupId { get; set; }
    public bool IsCompleted { get; set; }

    public ProjectGroup ProjectGroup { get; set; } = null!;
}
