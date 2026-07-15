using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Services;

public interface IInstructorDashboardService
{
    Task<CourseOverview> GetCourseOverviewAsync(Guid courseId, Guid instructorId);
    Task<GroupMonitoring[]> GetGroupMonitoringAsync(Guid courseId);
    Task<GroupHealthScore> GetGroupHealthScoreAsync(Guid projectGroupId);
    Task<ContributionMonitoring> GetContributionMonitoringAsync(Guid courseId);
    Task<ActivityTimelineEntry[]> GetActivityTimelineAsync(Guid courseId, int days = 30);
    Task<ParticipationHeatmapEntry[]> GetParticipationHeatmapAsync(Guid courseId);
}

public class InstructorDashboardService : IInstructorDashboardService
{
    private readonly SyncSpaceDbContext _db;

    public InstructorDashboardService(SyncSpaceDbContext db) => _db = db;

    public async Task<CourseOverview> GetCourseOverviewAsync(Guid courseId, Guid instructorId)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId && c.InstructorId == instructorId);
        if (course == null) throw new UnauthorizedAccessException("Course not found or access denied");

        var groups = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Include(g => g.Members)
            .Include(g => g.Milestones)
            .Include(g => g.Workspaces)
                .ThenInclude(w => w.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.Cards)
            .ToListAsync();

        var totalGroups = groups.Count;

        var now = DateTime.UtcNow;
        var activeGroups = groups.Count(g =>
            g.Members.Any(m =>
                _db.ContributionRecords.Any(cr =>
                    cr.StudentId == m.UserId &&
                    cr.ProjectGroupId == g.Id &&
                    cr.CreatedAt >= now.AddDays(-7))));

        var groupIds = groups.Select(g => g.Id).ToList();
        var upcomingDeadlines = await _db.Milestones
            .Where(m => groupIds.Contains(m.ProjectGroupId) &&
                       !m.IsCompleted &&
                       m.DueDate >= now &&
                       m.DueDate <= now.AddDays(14))
            .OrderBy(m => m.DueDate)
            .Select(m => new { m.Id, m.Title, m.DueDate, m.ProjectGroupId })
            .ToListAsync();

        var atRiskGroups = groups.Count(g =>
        {
            var totalCards = g.Workspaces.SelectMany(w => w.Boards)
                .SelectMany(b => b.Columns).SelectMany(c => c.Cards).Count();
            var doneCards = g.Workspaces.SelectMany(w => w.Boards)
                .SelectMany(b => b.Columns).Where(c => c.Name.ToLower().Contains("done") || c.Name.ToLower().Contains("complete"))
                .SelectMany(c => c.Cards).Count();
            var completionRate = totalCards > 0 ? (double)doneCards / totalCards : 0;

            var lastActivityDate = _db.ContributionRecords
                .Where(cr => cr.ProjectGroupId == g.Id)
                .Select(cr => (DateTime?)cr.CreatedAt)
                .Max();
            var daysSinceLastActivity = lastActivityDate.HasValue
                ? (now - lastActivityDate.Value).Days
                : 999;

            return completionRate < 0.3 || daysSinceLastActivity > 14;
        });

        return new CourseOverview
        {
            CourseId = courseId,
            CourseName = course.CourseName,
            CourseCode = course.CourseCode,
            TotalGroups = totalGroups,
            ActiveGroups = activeGroups,
            AtRiskGroups = atRiskGroups,
            UpcomingDeadlines = upcomingDeadlines.Select(d => new DeadlineItem
            {
                Id = d.Id,
                Title = d.Title,
                DueDate = d.DueDate,
                GroupId = d.ProjectGroupId
            }).ToArray()
        };
    }

    public async Task<GroupMonitoring[]> GetGroupMonitoringAsync(Guid courseId)
    {
        var groups = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Milestones)
            .Include(g => g.Workspaces)
                .ThenInclude(w => w.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.Cards)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var result = new List<GroupMonitoring>();

        foreach (var group in groups)
        {
            var allCards = group.Workspaces.SelectMany(w => w.Boards)
                .SelectMany(b => b.Columns).SelectMany(c => c.Cards).ToList();
            var doneCards = group.Workspaces.SelectMany(w => w.Boards)
                .SelectMany(b => b.Columns)
                .Where(c => c.Name.ToLower().Contains("done") || c.Name.ToLower().Contains("complete"))
                .SelectMany(c => c.Cards).ToList();

            var totalTasks = allCards.Count;
            var completedTasks = doneCards.Count;
            var pendingTasks = totalTasks - completedTasks;
            var progress = totalTasks > 0 ? Math.Round((double)completedTasks / totalTasks * 100, 1) : 0;

            var memberIds = group.Members.Select(m => m.UserId).ToList();
            var activeMembers = await _db.ContributionRecords
                .Where(cr => memberIds.Contains(cr.StudentId) && cr.CreatedAt >= now.AddDays(-7))
                .Select(cr => cr.StudentId)
                .Distinct()
                .CountAsync();

            var lastActivity = await _db.ContributionRecords
                .Where(cr => cr.ProjectGroupId == group.Id)
                .OrderByDescending(cr => cr.CreatedAt)
                .Select(cr => cr.CreatedAt)
                .FirstOrDefaultAsync();

            var completedMilestones = group.Milestones.Count(m => m.IsCompleted);
            var totalMilestones = group.Milestones.Count;

            result.Add(new GroupMonitoring
            {
                GroupId = group.Id,
                GroupName = group.GroupName,
                Progress = progress,
                ActiveMembers = activeMembers,
                TotalMembers = group.Members.Count,
                PendingTasks = pendingTasks,
                CompletedTasks = completedTasks,
                TotalTasks = totalTasks,
                CompletedMilestones = completedMilestones,
                TotalMilestones = totalMilestones,
                LastActivityAt = lastActivity == default ? now.AddDays(-30) : lastActivity,
                Members = group.Members.Select(m => new GroupMemberInfo
                {
                    UserId = m.UserId,
                    Name = m.User.FullName,
                    AvatarUrl = m.User.AvatarUrl
                }).ToArray()
            });
        }

        return result.OrderByDescending(g => g.Progress).ToArray();
    }

    public async Task<GroupHealthScore> GetGroupHealthScoreAsync(Guid projectGroupId)
    {
        var group = await _db.ProjectGroups
            .Include(g => g.Workspaces)
                .ThenInclude(w => w.Boards)
                    .ThenInclude(b => b.Columns)
                        .ThenInclude(c => c.Cards)
            .Include(g => g.Milestones)
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == projectGroupId);

        if (group == null) throw new ArgumentException("Group not found");

        var now = DateTime.UtcNow;
        var allCards = group.Workspaces.SelectMany(w => w.Boards)
            .SelectMany(b => b.Columns).SelectMany(c => c.Cards).ToList();
        var doneCards = group.Workspaces.SelectMany(w => w.Boards)
            .SelectMany(b => b.Columns)
            .Where(c => c.Name.ToLower().Contains("done") || c.Name.ToLower().Contains("complete"))
            .SelectMany(c => c.Cards).ToList();

        // Task Completion Score (0-40 points)
        var taskCompletionScore = allCards.Count > 0
            ? Math.Min(40, (double)doneCards.Count / allCards.Count * 40)
            : 20; // Default if no tasks yet

        // Activity Frequency Score (0-30 points)
        var recentActivities = await _db.ContributionRecords
            .Where(cr => cr.ProjectGroupId == projectGroupId && cr.CreatedAt >= now.AddDays(-7))
            .CountAsync();
        var memberCount = group.Members.Count;
        var expectedWeeklyActivities = memberCount * 5; // Expected 5 activities per member per week
        var activityScore = Math.Min(30, (double)recentActivities / Math.Max(1, expectedWeeklyActivities) * 30);

        // Deadline Compliance Score (0-30 points)
        var milestones = group.Milestones.ToList();
        var overdueMilestones = milestones.Count(m => !m.IsCompleted && m.DueDate < now);
        var totalMilestones = milestones.Count;
        var deadlineScore = totalMilestones > 0
            ? Math.Max(0, 30 - (double)overdueMilestones / totalMilestones * 30)
            : 30; // Default if no milestones

        var totalScore = (int)Math.Round(taskCompletionScore + activityScore + deadlineScore);
        totalScore = Math.Clamp(totalScore, 0, 100);

        var category = totalScore >= 80 ? "Excellent" :
                      totalScore >= 60 ? "Good" :
                      totalScore >= 40 ? "Moderate" : "At Risk";

        return new GroupHealthScore
        {
            GroupId = projectGroupId,
            GroupName = group.GroupName,
            TotalScore = totalScore,
            Category = category,
            TaskCompletionScore = (int)Math.Round(taskCompletionScore),
            ActivityFrequencyScore = (int)Math.Round(activityScore),
            DeadlineComplianceScore = (int)Math.Round(deadlineScore),
            TotalTasks = allCards.Count,
            CompletedTasks = doneCards.Count,
            RecentActivities = recentActivities,
            OverdueMilestones = overdueMilestones,
            TotalMilestones = totalMilestones
        };
    }

    public async Task<ContributionMonitoring> GetContributionMonitoringAsync(Guid courseId)
    {
        var groupIds = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Select(g => g.Id)
            .ToListAsync();

        var records = await _db.ContributionRecords
            .Where(cr => cr.ProjectGroupId != null && groupIds.Contains(cr.ProjectGroupId.Value))
            .Include(cr => cr.Student)
            .ToListAsync();

        var breakdown = records
            .GroupBy(r => r.ActivityType)
            .Select(g => new ActivityBreakdown
            {
                ActivityType = g.Key,
                Count = g.Count(),
                TotalScore = g.Sum(r => r.Score)
            })
            .ToArray();

        var byStudent = records
            .GroupBy(r => new { r.StudentId, r.Student.FullName })
            .Select(g => new StudentContribution
            {
                StudentId = g.Key.StudentId,
                StudentName = g.Key.FullName,
                TotalScore = g.Sum(r => r.Score),
                ActivityCount = g.Count(),
                Breakdown = g.GroupBy(r => r.ActivityType)
                    .ToDictionary(kg => kg.Key, kg => kg.Count())
            })
            .OrderByDescending(s => s.TotalScore)
            .ToArray();

        return new ContributionMonitoring
        {
            CourseId = courseId,
            TotalActivities = records.Count,
            TotalScore = records.Sum(r => r.Score),
            ActivityBreakdown = breakdown,
            StudentContributions = byStudent
        };
    }

    public async Task<ActivityTimelineEntry[]> GetActivityTimelineAsync(Guid courseId, int days = 30)
    {
        var groupIds = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Select(g => g.Id)
            .ToListAsync();

        var startDate = DateTime.UtcNow.AddDays(-days);

        var records = await _db.ContributionRecords
            .Where(cr => cr.ProjectGroupId != null &&
                        groupIds.Contains(cr.ProjectGroupId.Value) &&
                        cr.CreatedAt >= startDate)
            .Include(cr => cr.Student)
            .OrderByDescending(cr => cr.CreatedAt)
            .Take(100)
            .ToListAsync();

        return records.Select(r => new ActivityTimelineEntry
        {
            Id = r.Id,
            StudentName = r.Student.FullName,
            ActivityType = r.ActivityType,
            Score = r.Score,
            Timestamp = r.CreatedAt,
            ProjectGroupId = r.ProjectGroupId
        }).ToArray();
    }

    public async Task<ParticipationHeatmapEntry[]> GetParticipationHeatmapAsync(Guid courseId)
    {
        var groupIds = await _db.ProjectGroups
            .Where(g => g.CourseId == courseId)
            .Select(g => g.Id)
            .ToListAsync();

        var startDate = DateTime.UtcNow.AddDays(-28);

        var records = await _db.ContributionRecords
            .Where(cr => cr.ProjectGroupId != null &&
                        groupIds.Contains(cr.ProjectGroupId.Value) &&
                        cr.CreatedAt >= startDate)
            .ToListAsync();

        var heatmap = new List<ParticipationHeatmapEntry>();
        var today = DateTime.UtcNow.Date;

        for (var i = 0; i < 28; i++)
        {
            var date = today.AddDays(-27 + i);
            var dayRecords = records.Where(r => r.CreatedAt.Date == date);
            heatmap.Add(new ParticipationHeatmapEntry
            {
                Date = date,
                DayLabel = date.ToString("ddd"),
                ActivityCount = dayRecords.Count(),
                TotalScore = dayRecords.Sum(r => r.Score)
            });
        }

        return heatmap.ToArray();
    }
}

// --- DTOs ---

public class CourseOverview
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public int TotalGroups { get; set; }
    public int ActiveGroups { get; set; }
    public int AtRiskGroups { get; set; }
    public DeadlineItem[] UpcomingDeadlines { get; set; } = [];
}

public class DeadlineItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public Guid GroupId { get; set; }
}

public class GroupMonitoring
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public double Progress { get; set; }
    public int ActiveMembers { get; set; }
    public int TotalMembers { get; set; }
    public int PendingTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedMilestones { get; set; }
    public int TotalMilestones { get; set; }
    public DateTime LastActivityAt { get; set; }
    public GroupMemberInfo[] Members { get; set; } = [];
}

public class GroupMemberInfo
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class GroupHealthScore
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public string Category { get; set; } = string.Empty;
    public int TaskCompletionScore { get; set; }
    public int ActivityFrequencyScore { get; set; }
    public int DeadlineComplianceScore { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int RecentActivities { get; set; }
    public int OverdueMilestones { get; set; }
    public int TotalMilestones { get; set; }
}

public class ContributionMonitoring
{
    public Guid CourseId { get; set; }
    public int TotalActivities { get; set; }
    public decimal TotalScore { get; set; }
    public ActivityBreakdown[] ActivityBreakdown { get; set; } = [];
    public StudentContribution[] StudentContributions { get; set; } = [];
}

public class ActivityBreakdown
{
    public string ActivityType { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalScore { get; set; }
}

public class StudentContribution
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public int ActivityCount { get; set; }
    public Dictionary<string, int> Breakdown { get; set; } = new();
}

public class ActivityTimelineEntry
{
    public Guid Id { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ActivityType { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid? ProjectGroupId { get; set; }
}

public class ParticipationHeatmapEntry
{
    public DateTime Date { get; set; }
    public string DayLabel { get; set; } = string.Empty;
    public int ActivityCount { get; set; }
    public decimal TotalScore { get; set; }
}
