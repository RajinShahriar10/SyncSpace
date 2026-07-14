namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class BoardColumn : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public Guid BoardId { get; set; }
    public int Order { get; set; }

    public Board Board { get; set; } = null!;
    public ICollection<BoardCard> Cards { get; set; } = new List<BoardCard>();
}
