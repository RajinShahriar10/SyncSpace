using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class InstructorProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Department { get; set; }
    public string? Title { get; set; }

    public User User { get; set; } = null!;
}
