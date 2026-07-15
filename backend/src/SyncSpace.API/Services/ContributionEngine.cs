using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Services;

public interface IContributionEngine
{
    Task RecordActivityAsync(Guid studentId, ContributionActivity activity, string? referenceId = null, Guid? workspaceId = null, Guid? projectGroupId = null);
    Task<ContributionSummary> GetSummaryAsync(Guid studentId, Guid? projectGroupId = null);
    Task<LeaderboardEntry[]> GetLeaderboardAsync(Guid projectGroupId);
    Task<WeeklyActivity[]> GetWeeklyActivityAsync(Guid projectGroupId, int weeks = 4);
    Task<ContributionBreakdown> GetBreakdownAsync(Guid studentId, Guid? projectGroupId = null);
}

public class ContributionEngine : IContributionEngine
{
    private readonly SyncSpaceDbContext _db;

    private static readonly Dictionary<ContributionActivity, decimal> Scores = new()
    {
        [ContributionActivity.TaskCreated] = 5m,
        [ContributionActivity.TaskCompleted] = 15m,
        [ContributionActivity.DocumentEdited] = 3m,
        [ContributionActivity.FileUploaded] = 2m,
        [ContributionActivity.CommentAdded] = 1m,
        [ContributionActivity.MessageSent] = 0.5m
    };

    public ContributionEngine(SyncSpaceDbContext db) => _db = db;

    public async Task RecordActivityAsync(
        Guid studentId,
        ContributionActivity activity,
        string? referenceId = null,
        Guid? workspaceId = null,
        Guid? projectGroupId = null)
    {
        var score = Scores.GetValueOrDefault(activity, 0m);

        var record = new ContributionRecord
        {
            StudentId = studentId,
            ActivityType = activity.ToString(),
            ActivityReferenceId = referenceId,
            Score = score,
            WorkspaceId = workspaceId,
            ProjectGroupId = projectGroupId,
            CreatedAt = DateTime.UtcNow
        };

        _db.ContributionRecords.Add(record);
        await _db.SaveChangesAsync();
    }

    public async Task<ContributionSummary> GetSummaryAsync(Guid studentId, Guid? projectGroupId = null)
    {
        var query = _db.ContributionRecords
            .Where(r => r.StudentId == studentId);

        if (projectGroupId.HasValue)
            query = query.Where(r => r.ProjectGroupId == projectGroupId);

        var records = await query.ToListAsync();

        var totalScore = records.Sum(r => r.Score);
        var activityCounts = records
            .GroupBy(r => r.ActivityType)
            .ToDictionary(g => g.Key, g => g.Count());

        var today = DateTime.UtcNow.Date;
        var thisWeek = records.Where(r => r.CreatedAt >= today.AddDays(-7)).Sum(r => r.Score);
        var lastWeek = records.Where(r => r.CreatedAt >= today.AddDays(-14) && r.CreatedAt < today.AddDays(-7)).Sum(r => r.Score);

        return new ContributionSummary
        {
            TotalScore = totalScore,
            TotalActivities = records.Count,
            ActivityCounts = activityCounts,
            WeeklyScore = thisWeek,
            WeeklyChange = lastWeek > 0 ? Math.Round((thisWeek - lastWeek) / lastWeek * 100, 1) : 0,
            LastActiveAt = records.Any() ? records.Max(r => r.CreatedAt) : null
        };
    }

    public async Task<LeaderboardEntry[]> GetLeaderboardAsync(Guid projectGroupId)
    {
        var members = await _db.ProjectGroupMembers
            .Where(m => m.ProjectGroupId == projectGroupId)
            .Select(m => m.UserId)
            .ToListAsync();

        var records = await _db.ContributionRecords
            .Where(r => r.ProjectGroupId == projectGroupId && members.Contains(r.StudentId))
            .ToListAsync();

        var totalScore = records.Sum(r => r.Score);

        var studentScores = records
            .GroupBy(r => r.StudentId)
            .Select(g => new
            {
                StudentId = g.Key,
                Score = g.Sum(r => r.Score),
                Activities = g.Count(),
                LastActive = g.Max(r => r.CreatedAt)
            })
            .OrderByDescending(s => s.Score)
            .ToList();

        var users = await _db.Users
            .Where(u => members.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        return studentScores.Select((s, index) => new LeaderboardEntry
        {
            Rank = index + 1,
            StudentId = s.StudentId,
            StudentName = users.TryGetValue(s.StudentId, out var user) ? user.FullName : "Unknown",
            AvatarUrl = users.TryGetValue(s.StudentId, out var u) ? u.AvatarUrl : null,
            Score = s.Score,
            ContributionPercentage = totalScore > 0 ? Math.Round(s.Score / totalScore * 100, 1) : 0,
            TotalActivities = s.Activities,
            LastActiveAt = s.LastActive
        }).ToArray();
    }

    public async Task<WeeklyActivity[]> GetWeeklyActivityAsync(Guid projectGroupId, int weeks = 4)
    {
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-7 * weeks);

        var records = await _db.ContributionRecords
            .Where(r => r.ProjectGroupId == projectGroupId && r.CreatedAt >= startDate)
            .ToListAsync();

        var result = new List<WeeklyActivity>();

        for (var i = 0; i < weeks; i++)
        {
            var weekStart = startDate.AddDays(7 * i);
            var weekEnd = weekStart.AddDays(7);
            var weekRecords = records.Where(r => r.CreatedAt >= weekStart && r.CreatedAt < weekEnd);

            result.Add(new WeeklyActivity
            {
                WeekStart = weekStart,
                WeekLabel = $"Week {i + 1}",
                TotalScore = weekRecords.Sum(r => r.Score),
                TotalActivities = weekRecords.Count(),
                ActivityBreakdown = weekRecords
                    .GroupBy(r => r.ActivityType)
                    .ToDictionary(g => g.Key, g => g.Count())
            });
        }

        return result.ToArray();
    }

    public async Task<ContributionBreakdown> GetBreakdownAsync(Guid studentId, Guid? projectGroupId = null)
    {
        var query = _db.ContributionRecords
            .Where(r => r.StudentId == studentId);

        if (projectGroupId.HasValue)
            query = query.Where(r => r.ProjectGroupId == projectGroupId);

        var records = await query.ToListAsync();

        var breakdown = Scores.Select(s => new ActivityScore
        {
            ActivityType = s.Key.ToString(),
            Count = records.Count(r => r.ActivityType == s.Key.ToString()),
            PointsPerUnit = s.Value,
            TotalPoints = records.Where(r => r.ActivityType == s.Key.ToString()).Sum(r => r.Score)
        }).ToArray();

        return new ContributionBreakdown
        {
            StudentId = studentId,
            Activities = breakdown,
            TotalScore = records.Sum(r => r.Score)
        };
    }
}

public class ContributionSummary
{
    public decimal TotalScore { get; set; }
    public int TotalActivities { get; set; }
    public Dictionary<string, int> ActivityCounts { get; set; } = new();
    public decimal WeeklyScore { get; set; }
    public decimal WeeklyChange { get; set; }
    public DateTime? LastActiveAt { get; set; }
}

public class LeaderboardEntry
{
    public int Rank { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public decimal Score { get; set; }
    public decimal ContributionPercentage { get; set; }
    public int TotalActivities { get; set; }
    public DateTime LastActiveAt { get; set; }
}

public class WeeklyActivity
{
    public DateTime WeekStart { get; set; }
    public string WeekLabel { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public int TotalActivities { get; set; }
    public Dictionary<string, int> ActivityBreakdown { get; set; } = new();
}

public class ContributionBreakdown
{
    public Guid StudentId { get; set; }
    public ActivityScore[] Activities { get; set; } = [];
    public decimal TotalScore { get; set; }
}

public class ActivityScore
{
    public string ActivityType { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal PointsPerUnit { get; set; }
    public decimal TotalPoints { get; set; }
}
