using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.Entities;

public class Milestone : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public Guid ProjectGroupId { get; set; }
    public MilestoneStatus Status { get; set; } = MilestoneStatus.NotStarted;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Order { get; set; }

    public ProjectGroup ProjectGroup { get; set; } = null!;
    public ICollection<MilestoneAssignment> Assignments { get; set; } = new List<MilestoneAssignment>();
    public ICollection<MilestoneReminder> Reminders { get; set; } = new List<MilestoneReminder>();
}

public class MilestoneAssignment : BaseEntity
{
    public Guid MilestoneId { get; set; }
    public Guid UserId { get; set; }

    public Milestone Milestone { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class MilestoneReminder : BaseEntity
{
    public Guid MilestoneId { get; set; }
    public int DaysBeforeDue { get; set; }
    public string ReminderType { get; set; } = string.Empty;
    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }

    public Milestone Milestone { get; set; } = null!;
}
