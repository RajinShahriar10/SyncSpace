namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Label : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366F1";
    public Guid WorkspaceId { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public ICollection<CardLabel> CardLabels { get; set; } = new List<CardLabel>();
}

public class CardLabel : BaseEntity
{
    public Guid CardId { get; set; }
    public Guid LabelId { get; set; }

    public BoardCard Card { get; set; } = null!;
    public Label Label { get; set; } = null!;
}
