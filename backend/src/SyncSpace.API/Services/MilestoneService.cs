using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Services;

public interface IMilestoneService
{
    Task<MilestoneDto> CreateMilestoneAsync(CreateMilestoneRequest request);
    Task<MilestoneDto> UpdateMilestoneAsync(Guid id, UpdateMilestoneRequest request);
    Task<bool> DeleteMilestoneAsync(Guid id);
    Task<MilestoneDto?> GetMilestoneAsync(Guid id);
    Task<MilestoneDto[]> GetMilestonesByGroupAsync(Guid projectGroupId);
    Task<MilestoneDto[]> GetMilestonesByCourseAsync(Guid courseId);
    Task<MilestoneProgress> GetMilestoneProgressAsync(Guid projectGroupId);
    Task<MilestoneTimelineEntry[]> GetTimelineAsync(Guid projectGroupId);
    Task<MilestoneHistoryEntry[]> GetHistoryAsync(Guid projectGroupId);
    Task<bool> AssignMembersAsync(Guid milestoneId, Guid[] userIds);
    Task<bool> CompleteMilestoneAsync(Guid milestoneId);
    Task<MilestoneReminderDto[]> GetRemindersAsync(Guid milestoneId);
    Task<MilestoneReminderDto[]> GenerateRemindersAsync(Guid milestoneId);
    Task ProcessRemindersAsync();
    Task<CourseMilestoneSummary> GetCourseMilestoneSummaryAsync(Guid courseId);
}

public class MilestoneService : IMilestoneService
{
    private readonly SyncSpaceDbContext _db;

    private static readonly int[] ReminderDaysBefore = [7, 3, 1];

    public MilestoneService(SyncSpaceDbContext db) => _db = db;

    public async Task<MilestoneDto> CreateMilestoneAsync(CreateMilestoneRequest request)
    {
        var milestone = new Milestone
        {
            Title = request.Title,
            Description = request.Description,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            ProjectGroupId = request.ProjectGroupId,
            Order = request.Order,
            Status = MilestoneStatus.NotStarted
        };

        _db.Milestones.Add(milestone);
        await _db.SaveChangesAsync();

        if (request.AssignedUserIds?.Length > 0)
        {
            foreach (var userId in request.AssignedUserIds)
            {
                _db.MilestoneAssignments.Add(new MilestoneAssignment
                {
                    MilestoneId = milestone.Id,
                    UserId = userId
                });
            }
            await _db.SaveChangesAsync();
        }

        await GenerateRemindersAsync(milestone.Id);
        return await GetMilestoneAsync(milestone.Id) ?? MapToDto(milestone, new List<MilestoneAssignment>());
    }

    public async Task<MilestoneDto> UpdateMilestoneAsync(Guid id, UpdateMilestoneRequest request)
    {
        var milestone = await _db.Milestones.FindAsync(id);
        if (milestone == null) throw new ArgumentException("Milestone not found");

        if (request.Title != null) milestone.Title = request.Title;
        if (request.Description != null) milestone.Description = request.Description;
        if (request.StartDate.HasValue) milestone.StartDate = request.StartDate.Value;
        if (request.DueDate.HasValue) milestone.DueDate = request.DueDate.Value;
        if (request.Status.HasValue) milestone.Status = request.Status.Value;
        if (request.Order.HasValue) milestone.Order = request.Order.Value;

        if (request.Status == MilestoneStatus.Completed && !milestone.IsCompleted)
        {
            milestone.IsCompleted = true;
            milestone.CompletedAt = DateTime.UtcNow;
        }
        else if (request.Status != MilestoneStatus.Completed)
        {
            milestone.IsCompleted = false;
            milestone.CompletedAt = null;
        }

        milestone.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (request.AssignedUserIds != null)
        {
            var existing = await _db.MilestoneAssignments
                .Where(a => a.MilestoneId == id)
                .ToListAsync();
            _db.MilestoneAssignments.RemoveRange(existing);

            foreach (var userId in request.AssignedUserIds)
            {
                _db.MilestoneAssignments.Add(new MilestoneAssignment
                {
                    MilestoneId = id,
                    UserId = userId
                });
            }
            await _db.SaveChangesAsync();
        }

        return await GetMilestoneAsync(id) ?? MapToDto(milestone, new List<MilestoneAssignment>());
    }

    public async Task<bool> DeleteMilestoneAsync(Guid id)
    {
        var milestone = await _db.Milestones.FindAsync(id);
        if (milestone == null) return false;

        var assignments = await _db.MilestoneAssignments.Where(a => a.MilestoneId == id).ToListAsync();
        var reminders = await _db.MilestoneReminders.Where(r => r.MilestoneId == id).ToListAsync();

        _db.MilestoneAssignments.RemoveRange(assignments);
        _db.MilestoneReminders.RemoveRange(reminders);
        _db.Milestones.Remove(milestone);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<MilestoneDto?> GetMilestoneAsync(Guid id)
    {
        var milestone = await _db.Milestones
            .Include(m => m.Assignments)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(m => m.Id == id);

        return milestone == null ? null : MapToDto(milestone, milestone.Assignments);
    }

    public async Task<MilestoneDto[]> GetMilestonesByGroupAsync(Guid projectGroupId)
    {
        var milestones = await _db.Milestones
            .Include(m => m.Assignments)
                .ThenInclude(a => a.User)
            .Where(m => m.ProjectGroupId == projectGroupId)
            .OrderBy(m => m.Order)
            .ThenBy(m => m.DueDate)
            .ToListAsync();

        return milestones.Select(m => MapToDto(m, m.Assignments)).ToArray();
    }

    public async Task<MilestoneDto[]> GetMilestonesByCourseAsync(Guid courseId)
    {
        var milestones = await _db.Milestones
            .Include(m => m.Assignments)
                .ThenInclude(a => a.User)
            .Include(m => m.ProjectGroup)
            .Where(m => m.ProjectGroup.CourseId == courseId)
            .OrderBy(m => m.ProjectGroup.GroupName)
            .ThenBy(m => m.Order)
            .ToListAsync();

        return milestones.Select(m => MapToDto(m, m.Assignments)).ToArray();
    }

    public async Task<MilestoneProgress> GetMilestoneProgressAsync(Guid projectGroupId)
    {
        var milestones = await _db.Milestones
            .Where(m => m.ProjectGroupId == projectGroupId)
            .ToListAsync();

        var total = milestones.Count;
        var completed = milestones.Count(m => m.Status == MilestoneStatus.Completed);
        var inProgress = milestones.Count(m => m.Status == MilestoneStatus.InProgress);
        var delayed = milestones.Count(m => m.Status == MilestoneStatus.Delayed);
        var notStarted = milestones.Count(m => m.Status == MilestoneStatus.NotStarted);

        var now = DateTime.UtcNow;
        var overdue = milestones.Count(m => !m.IsCompleted && m.DueDate < now);

        return new MilestoneProgress
        {
            ProjectGroupId = projectGroupId,
            TotalMilestones = total,
            Completed = completed,
            InProgress = inProgress,
            Delayed = delayed,
            NotStarted = notStarted,
            Overdue = overdue,
            CompletionPercentage = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0
        };
    }

    public async Task<MilestoneTimelineEntry[]> GetTimelineAsync(Guid projectGroupId)
    {
        var milestones = await _db.Milestones
            .Include(m => m.Assignments)
                .ThenInclude(a => a.User)
            .Where(m => m.ProjectGroupId == projectGroupId)
            .OrderBy(m => m.StartDate)
            .ToListAsync();

        return milestones.Select(m => new MilestoneTimelineEntry
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            StartDate = m.StartDate,
            DueDate = m.DueDate,
            Status = m.Status.ToString(),
            IsCompleted = m.IsCompleted,
            CompletedAt = m.CompletedAt,
            Order = m.Order,
            AssignedMembers = m.Assignments.Select(a => new AssignedMember
            {
                UserId = a.UserId,
                Name = a.User.FullName,
                AvatarUrl = a.User.AvatarUrl
            }).ToArray()
        }).ToArray();
    }

    public async Task<MilestoneHistoryEntry[]> GetHistoryAsync(Guid projectGroupId)
    {
        var milestones = await _db.Milestones
            .Include(m => m.Assignments)
                .ThenInclude(a => a.User)
            .Where(m => m.ProjectGroupId == projectGroupId && m.IsCompleted)
            .OrderByDescending(m => m.CompletedAt)
            .ToListAsync();

        return milestones.Select(m => new MilestoneHistoryEntry
        {
            Id = m.Id,
            Title = m.Title,
            CompletedAt = m.CompletedAt ?? m.UpdatedAt,
            DueDate = m.DueDate,
            WasOnTime = (m.CompletedAt ?? m.UpdatedAt) <= m.DueDate,
            CompletedBy = m.Assignments.FirstOrDefault()?.User.FullName ?? "Unknown"
        }).ToArray();
    }

    public async Task<bool> AssignMembersAsync(Guid milestoneId, Guid[] userIds)
    {
        var milestone = await _db.Milestones.FindAsync(milestoneId);
        if (milestone == null) return false;

        var existing = await _db.MilestoneAssignments
            .Where(a => a.MilestoneId == milestoneId)
            .ToListAsync();
        _db.MilestoneAssignments.RemoveRange(existing);

        foreach (var userId in userIds)
        {
            _db.MilestoneAssignments.Add(new MilestoneAssignment
            {
                MilestoneId = milestoneId,
                UserId = userId
            });
        }
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteMilestoneAsync(Guid milestoneId)
    {
        var milestone = await _db.Milestones.FindAsync(milestoneId);
        if (milestone == null) return false;

        milestone.Status = MilestoneStatus.Completed;
        milestone.IsCompleted = true;
        milestone.CompletedAt = DateTime.UtcNow;
        milestone.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<MilestoneReminderDto[]> GetRemindersAsync(Guid milestoneId)
    {
        var reminders = await _db.MilestoneReminders
            .Where(r => r.MilestoneId == milestoneId)
            .OrderBy(r => r.DaysBeforeDue)
            .ToListAsync();

        return reminders.Select(r => MapReminderToDto(r)).ToArray();
    }

    public async Task<MilestoneReminderDto[]> GenerateRemindersAsync(Guid milestoneId)
    {
        var milestone = await _db.Milestones.FindAsync(milestoneId);
        if (milestone == null) throw new ArgumentException("Milestone not found");

        var existing = await _db.MilestoneReminders
            .Where(r => r.MilestoneId == milestoneId)
            .ToListAsync();

        if (existing.Any()) return existing.Select(r => MapReminderToDto(r)).ToArray();

        var reminders = new List<MilestoneReminder>();
        foreach (var days in ReminderDaysBefore)
        {
            var reminder = new MilestoneReminder
            {
                MilestoneId = milestoneId,
                DaysBeforeDue = days,
                ReminderType = days switch
                {
                    7 => "WeekReminder",
                    3 => "ThreeDayReminder",
                    1 => "TomorrowReminder",
                    _ => "CustomReminder"
                },
                IsSent = false
            };
            reminders.Add(reminder);
            _db.MilestoneReminders.Add(reminder);
        }

        _db.MilestoneReminders.Add(new MilestoneReminder
        {
            MilestoneId = milestoneId,
            DaysBeforeDue = 0,
            ReminderType = "OverdueAlert",
            IsSent = false
        });

        await _db.SaveChangesAsync();
        return reminders.Select(r => MapReminderToDto(r)).ToArray();
    }

    public async Task ProcessRemindersAsync()
    {
        var now = DateTime.UtcNow;
        var pendingReminders = await _db.MilestoneReminders
            .Include(r => r.Milestone)
            .Where(r => !r.IsSent && r.Milestone.DueDate > now)
            .ToListAsync();

        foreach (var reminder in pendingReminders)
        {
            var reminderDate = reminder.Milestone.DueDate.AddDays(-reminder.DaysBeforeDue);
            if (now >= reminderDate)
            {
                reminder.IsSent = true;
                reminder.SentAt = now;
            }
        }

        var overdueReminders = await _db.MilestoneReminders
            .Include(r => r.Milestone)
            .Where(r => !r.IsSent && r.ReminderType == "OverdueAlert" && r.Milestone.DueDate <= now && !r.Milestone.IsCompleted)
            .ToListAsync();

        foreach (var reminder in overdueReminders)
        {
            reminder.IsSent = true;
            reminder.SentAt = now;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<CourseMilestoneSummary> GetCourseMilestoneSummaryAsync(Guid courseId)
    {
        var milestones = await _db.Milestones
            .Include(m => m.ProjectGroup)
            .Where(m => m.ProjectGroup.CourseId == courseId)
            .ToListAsync();

        var total = milestones.Count;
        var completed = milestones.Count(m => m.Status == MilestoneStatus.Completed);
        var inProgress = milestones.Count(m => m.Status == MilestoneStatus.InProgress);
        var delayed = milestones.Count(m => m.Status == MilestoneStatus.Delayed);
        var overdue = milestones.Count(m => !m.IsCompleted && m.DueDate < DateTime.UtcNow);

        var byGroup = milestones
            .GroupBy(m => new { m.ProjectGroupId, m.ProjectGroup.GroupName })
            .Select(g => new GroupMilestoneSummary
            {
                GroupId = g.Key.ProjectGroupId,
                GroupName = g.Key.GroupName,
                Total = g.Count(),
                Completed = g.Count(m => m.Status == MilestoneStatus.Completed),
                CompletionPercentage = g.Count() > 0 ? Math.Round((double)g.Count(m => m.Status == MilestoneStatus.Completed) / g.Count() * 100, 1) : 0
            })
            .ToArray();

        return new CourseMilestoneSummary
        {
            CourseId = courseId,
            TotalMilestones = total,
            Completed = completed,
            InProgress = inProgress,
            Delayed = delayed,
            Overdue = overdue,
            OverallCompletion = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0,
            GroupSummaries = byGroup
        };
    }

    private MilestoneDto MapToDto(Milestone m, ICollection<MilestoneAssignment> assignments)
    {
        return new MilestoneDto
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            StartDate = m.StartDate,
            DueDate = m.DueDate,
            Status = m.Status.ToString(),
            IsCompleted = m.IsCompleted,
            CompletedAt = m.CompletedAt,
            ProjectGroupId = m.ProjectGroupId,
            Order = m.Order,
            AssignedMembers = assignments.Select(a => new AssignedMember
            {
                UserId = a.UserId,
                Name = a.User?.FullName ?? "Unknown",
                AvatarUrl = a.User?.AvatarUrl
            }).ToArray()
        };
    }

    private MilestoneReminderDto MapReminderToDto(MilestoneReminder r)
    {
        return new MilestoneReminderDto
        {
            Id = r.Id,
            DaysBeforeDue = r.DaysBeforeDue,
            ReminderType = r.ReminderType,
            IsSent = r.IsSent,
            SentAt = r.SentAt
        };
    }
}

// --- DTOs ---

public record CreateMilestoneRequest(
    string Title,
    string? Description,
    DateTime StartDate,
    DateTime DueDate,
    Guid ProjectGroupId,
    int Order = 0,
    Guid[]? AssignedUserIds = null
);

public record UpdateMilestoneRequest(
    string? Title = null,
    string? Description = null,
    DateTime? StartDate = null,
    DateTime? DueDate = null,
    MilestoneStatus? Status = null,
    int? Order = null,
    Guid[]? AssignedUserIds = null
);

public class MilestoneDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid ProjectGroupId { get; set; }
    public int Order { get; set; }
    public AssignedMember[] AssignedMembers { get; set; } = [];
}

public class AssignedMember
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class MilestoneProgress
{
    public Guid ProjectGroupId { get; set; }
    public int TotalMilestones { get; set; }
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int Delayed { get; set; }
    public int NotStarted { get; set; }
    public int Overdue { get; set; }
    public double CompletionPercentage { get; set; }
}

public class MilestoneTimelineEntry
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Order { get; set; }
    public AssignedMember[] AssignedMembers { get; set; } = [];
}

public class MilestoneHistoryEntry
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
    public DateTime DueDate { get; set; }
    public bool WasOnTime { get; set; }
    public string CompletedBy { get; set; } = string.Empty;
}

public class MilestoneReminderDto
{
    public Guid Id { get; set; }
    public int DaysBeforeDue { get; set; }
    public string ReminderType { get; set; } = string.Empty;
    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }
}

public class CourseMilestoneSummary
{
    public Guid CourseId { get; set; }
    public int TotalMilestones { get; set; }
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int Delayed { get; set; }
    public int Overdue { get; set; }
    public double OverallCompletion { get; set; }
    public GroupMilestoneSummary[] GroupSummaries { get; set; } = [];
}

public class GroupMilestoneSummary
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Completed { get; set; }
    public double CompletionPercentage { get; set; }
}
