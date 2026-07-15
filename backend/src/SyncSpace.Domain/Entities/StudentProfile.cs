using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.Entities;

public class StudentProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string StudentIdNumber { get; set; } = string.Empty;
    public string? Major { get; set; }
    public int? YearOfStudy { get; set; }

    public User User { get; set; } = null!;
}
