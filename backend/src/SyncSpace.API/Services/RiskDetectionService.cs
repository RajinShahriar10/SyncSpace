using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Services;

public interface IRiskDetectionService
{
    Task<RiskAssessmentDto> AssessGroupRiskAsync(Guid projectGroupId);
    Task<RiskDashboardDto> GetDashboardAsync(Guid? courseId = null);
    Task<RiskAssessmentDto[]> GetAllAssessmentsAsync(Guid? courseId = null, RiskLevel? riskLevel = null);
    Task<RiskAlertDto[]> GetAlertsAsync(Guid? courseId = null, RiskLevel? severity = null, bool? acknowledged = null);
    Task<bool> AcknowledgeAlertAsync(Guid alertId, Guid userId);
    Task<GroupRiskDetailDto> GetGroupDetailAsync(Guid projectGroupId);
    Task<AutoRefreshPayload> GetAutoRefreshAsync(DateTime? since = null);
}

public class RiskDetectionService : IRiskDetectionService
{
    private readonly SyncSpaceDbContext _db;

    private const int InactiveMemberDays = 7;
    private const int CommunicationBreakdownDays = 5;
    private const int LowContributionThreshold = 3;
    private const int PendingTaskWarningPercent = 60;
    private const int PendingTaskCriticalPercent = 80;

    public RiskDetectionService(SyncSpaceDbContext db) => _db = db;

    public async Task<RiskAssessmentDto> AssessGroupRiskAsync(Guid projectGroupId)
    {
        var group = await _db.ProjectGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Milestones)
            .Include(g => g.Workspaces).ThenInclude(w => w.Boards).ThenInclude(b => b.Columns).ThenInclude(c => c.Cards)
            .FirstOrDefaultAsync(g => g.Id == projectGroupId);

        if (group == null) throw new ArgumentException("Project group not found");

        var memberIds = group.Members.Select(m => m.UserId).ToList();
        var workspaceIds = group.Workspaces.Select(w => w.Id).ToList();
        var boardIds = group.Workspaces.SelectMany(w => w.Boards).Select(b => b.Id).ToList();

        var now = DateTime.UtcNow;
        var inactiveThreshold = now.AddDays(-InactiveMemberDays);
        var commThreshold = now.AddDays(-CommunicationBreakdownDays);

        // 1. Inactive Members (0-25)
        var memberActivities = await _db.ContributionRecords
            .Where(c => memberIds.Contains(c.StudentId) && workspaceIds.Contains(c.WorkspaceId ?? Guid.Empty))
            .GroupBy(c => c.StudentId)
            .Select(g => new MemberActivityInfo { UserId = g.Key, LastActivity = g.Max(c => c.CreatedAt), Count = g.Count() })
            .ToListAsync();

        var activeMemberIds = memberActivities
            .Where(a => a.LastActivity >= inactiveThreshold)
            .Select(a => a.UserId)
            .ToHashSet();
        activeMemberIds.IntersectWith(memberIds);

        var inactiveCount = memberIds.Count - activeMemberIds.Count;
        var inactivePercent = memberIds.Count > 0 ? (double)inactiveCount / memberIds.Count : 0;
        var inactiveScore = inactivePercent > 0.5 ? 25 : inactivePercent > 0.25 ? 15 : inactivePercent > 0 ? 8 : 0;

        // 2. Delayed Milestones (0-25)
        var delayedMilestones = group.Milestones
            .Where(m => !m.IsCompleted && m.DueDate < now)
            .ToList();
        var approachingMilestones = group.Milestones
            .Where(m => !m.IsCompleted && m.DueDate >= now && m.DueDate <= now.AddDays(2))
            .ToList();
        var delayedScore = delayedMilestones.Count > 2 ? 25 : delayedMilestones.Count >= 1 ? 15 : approachingMilestones.Count > 0 ? 5 : 0;

        // 3. Low Contribution (0-20)
        var contributionScores = memberIds.Select(id =>
        {
            var activity = memberActivities.FirstOrDefault(a => a.UserId == id);
            return new { UserId = id, Score = activity?.Count ?? 0 };
        }).ToList();

        var belowThreshold = contributionScores.Count(c => c.Score < LowContributionThreshold);
        var belowPercent = memberIds.Count > 0 ? (double)belowThreshold / memberIds.Count : 0;
        var lowContributionScore = belowPercent > 0.5 ? 20 : belowPercent > 0.25 ? 12 : belowPercent > 0 ? 5 : 0;

        // 4. Communication Breakdown (0-15)
        var channelIds = await _db.Channels
            .Where(c => workspaceIds.Contains(c.WorkspaceId))
            .Select(c => c.Id)
            .ToListAsync();

        var lastMessageDate = await _db.Messages
            .Where(m => channelIds.Contains(m.ChannelId))
            .MaxAsync(m => (DateTime?)m.CreatedAt);

        var commDaysSince = lastMessageDate.HasValue ? (now - lastMessageDate.Value).TotalDays : 999;
        var communicationScore = commDaysSince >= CommunicationBreakdownDays ? 15 : commDaysSince >= 3 ? 8 : commDaysSince >= 1 ? 3 : 0;

        // 5. Task Bottlenecks (0-15)
        var allCards = await _db.BoardCards
            .Where(c => boardIds.Contains(c.Column.BoardId))
            .ToListAsync();

        var totalCards = allCards.Count;
        var pendingCards = allCards.Count(c => !c.Column.Name.Contains("Done", StringComparison.OrdinalIgnoreCase)
            && !c.Column.Name.Contains("Complete", StringComparison.OrdinalIgnoreCase)
            && !c.Column.Name.Contains("Archive", StringComparison.OrdinalIgnoreCase));

        var pendingPercent = totalCards > 0 ? (double)pendingCards / totalCards * 100 : 0;
        var bottleneckScore = pendingPercent >= PendingTaskCriticalPercent ? 15 : pendingPercent >= PendingTaskWarningPercent ? 10 : pendingPercent >= 40 ? 5 : 0;

        // Overall
        var overallScore = inactiveScore + delayedScore + lowContributionScore + communicationScore + bottleneckScore;
        var riskLevel = overallScore >= 61 ? RiskLevel.High : overallScore >= 31 ? RiskLevel.Medium : RiskLevel.Low;

        // Generate alerts
        var alerts = new List<RiskAlert>();
        GenerateAlerts(alerts, group.Id, inactiveScore, inactiveCount, memberIds.Count, delayedMilestones, approachingMilestones, belowThreshold, memberIds.Count, commDaysSince, lastMessageDate, pendingPercent, totalCards, pendingCards, riskLevel);

        // Upsert assessment
        var existing = await _db.RiskAssessments.FirstOrDefaultAsync(a => a.ProjectGroupId == projectGroupId);
        if (existing != null)
        {
            existing.OverallScore = overallScore;
            existing.RiskLevel = riskLevel;
            existing.InactiveMembersScore = inactiveScore;
            existing.DelayedMilestonesScore = delayedScore;
            existing.LowContributionScore = lowContributionScore;
            existing.CommunicationScore = communicationScore;
            existing.TaskBottleneckScore = bottleneckScore;
            existing.AssessedAt = now;
            existing.UpdatedAt = now;
        }
        else
        {
            existing = new RiskAssessment
            {
                ProjectGroupId = projectGroupId,
                OverallScore = overallScore,
                RiskLevel = riskLevel,
                InactiveMembersScore = inactiveScore,
                DelayedMilestonesScore = delayedScore,
                LowContributionScore = lowContributionScore,
                CommunicationScore = communicationScore,
                TaskBottleneckScore = bottleneckScore,
                AssessedAt = now
            };
            _db.RiskAssessments.Add(existing);
        }

        // Remove old alerts for this group and add new
        var oldAlerts = await _db.RiskAlerts.Where(a => a.ProjectGroupId == projectGroupId && !a.IsAcknowledged).ToListAsync();
        _db.RiskAlerts.RemoveRange(oldAlerts);
        await _db.SaveChangesAsync();

        foreach (var alert in alerts)
        {
            alert.AssessmentId = existing.Id;
            _db.RiskAlerts.Add(alert);
        }
        await _db.SaveChangesAsync();

        // Reload with includes
        var reloaded = await _db.RiskAssessments
            .Include(a => a.Alerts)
            .Include(a => a.ProjectGroup)
            .FirstOrDefaultAsync(a => a.Id == existing.Id);

        return MapAssessmentToDto(reloaded!, group, memberActivities, inactiveCount, delayedMilestones.Count, belowThreshold, commDaysSince, pendingPercent);
    }

    public async Task<RiskDashboardDto> GetDashboardAsync(Guid? courseId = null)
    {
        var query = _db.ProjectGroups
            .Include(g => g.Course)
            .Include(g => g.Members)
            .Include(g => g.Milestones)
            .AsQueryable();

        if (courseId.HasValue)
            query = query.Where(g => g.CourseId == courseId.Value);

        var groups = await query.ToListAsync();
        var groupIds = groups.Select(g => g.Id).ToList();

        var assessments = await _db.RiskAssessments
            .Where(a => groupIds.Contains(a.ProjectGroupId))
            .ToListAsync();

        var alertCounts = await _db.RiskAlerts
            .Where(a => groupIds.Contains(a.ProjectGroupId) && !a.IsAcknowledged)
            .GroupBy(a => a.Severity)
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToListAsync();

        var highRiskGroups = groups.Count(g =>
        {
            var a = assessments.FirstOrDefault(x => x.ProjectGroupId == g.Id);
            return a?.RiskLevel == RiskLevel.High;
        });
        var mediumRiskGroups = groups.Count(g =>
        {
            var a = assessments.FirstOrDefault(x => x.ProjectGroupId == g.Id);
            return a?.RiskLevel == RiskLevel.Medium;
        });
        var lowRiskGroups = groups.Count(g =>
        {
            var a = assessments.FirstOrDefault(x => x.ProjectGroupId == g.Id);
            return a?.RiskLevel == RiskLevel.Low;
        });
        var unassessedGroups = groups.Count(g => !assessments.Any(a => a.ProjectGroupId == g.Id));

        var totalMilestones = groups.SelectMany(g => g.Milestones).Count();
        var delayedMilestones = groups.SelectMany(g => g.Milestones).Count(m => !m.IsCompleted && m.DueDate < DateTime.UtcNow);

        return new RiskDashboardDto
        {
            TotalGroups = groups.Count,
            HighRiskGroups = highRiskGroups,
            MediumRiskGroups = mediumRiskGroups,
            LowRiskGroups = lowRiskGroups,
            UnassessedGroups = unassessedGroups,
            TotalAlerts = alertCounts.Sum(a => a.Count),
            HighSeverityAlerts = alertCounts.FirstOrDefault(a => a.Level == RiskLevel.High)?.Count ?? 0,
            MediumSeverityAlerts = alertCounts.FirstOrDefault(a => a.Level == RiskLevel.Medium)?.Count ?? 0,
            LowSeverityAlerts = alertCounts.FirstOrDefault(a => a.Level == RiskLevel.Low)?.Count ?? 0,
            TotalMilestones = totalMilestones,
            DelayedMilestones = delayedMilestones,
            OverallHealth = groups.Count > 0 ? Math.Round((double)lowRiskGroups / groups.Count * 100, 1) : 100
        };
    }

    public async Task<RiskAssessmentDto[]> GetAllAssessmentsAsync(Guid? courseId = null, RiskLevel? riskLevel = null)
    {
        var query = _db.RiskAssessments
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Course)
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Members)
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Milestones)
            .Include(a => a.Alerts)
            .AsQueryable();

        if (courseId.HasValue)
            query = query.Where(a => a.ProjectGroup.CourseId == courseId.Value);
        if (riskLevel.HasValue)
            query = query.Where(a => a.RiskLevel == riskLevel.Value);

        query = query.OrderByDescending(a => a.OverallScore);

        var assessments = await query.ToListAsync();

        return assessments.Select(a =>
        {
            var memberIds = a.ProjectGroup.Members.Select(m => m.UserId).ToList();
            var memberActivities = _db.ContributionRecords
                .Where(c => memberIds.Contains(c.StudentId))
                .GroupBy(c => c.StudentId)
                .Select(g => new MemberActivityInfo { UserId = g.Key, LastActivity = g.Max(c => c.CreatedAt), Count = g.Count() })
                .ToList();

            var inactiveThreshold = DateTime.UtcNow.AddDays(-InactiveMemberDays);
            var inactiveCount = memberIds.Count(id => !memberActivities.Any(a => a.UserId == id && a.LastActivity >= inactiveThreshold));
            var delayedCount = a.ProjectGroup.Milestones.Count(m => !m.IsCompleted && m.DueDate < DateTime.UtcNow);

            return MapAssessmentToDto(a, a.ProjectGroup, memberActivities, inactiveCount, delayedCount, 0, 0, 0);
        }).ToArray();
    }

    public async Task<RiskAlertDto[]> GetAlertsAsync(Guid? courseId = null, RiskLevel? severity = null, bool? acknowledged = null)
    {
        var query = _db.RiskAlerts
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Course)
            .Include(a => a.Assessment)
            .AsQueryable();

        if (courseId.HasValue)
            query = query.Where(a => a.ProjectGroup.CourseId == courseId.Value);
        if (severity.HasValue)
            query = query.Where(a => a.Severity == severity.Value);
        if (acknowledged.HasValue)
            query = query.Where(a => a.IsAcknowledged == acknowledged.Value);

        query = query.OrderByDescending(a => a.CreatedAt);

        var alerts = await query.ToListAsync();
        return alerts.Select(MapAlertToDto).ToArray();
    }

    public async Task<bool> AcknowledgeAlertAsync(Guid alertId, Guid userId)
    {
        var alert = await _db.RiskAlerts.FindAsync(alertId);
        if (alert == null) return false;
        alert.IsAcknowledged = true;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgedById = userId;
        alert.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<GroupRiskDetailDto> GetGroupDetailAsync(Guid projectGroupId)
    {
        var assessment = await _db.RiskAssessments
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Members).ThenInclude(m => m.User)
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Milestones)
            .Include(a => a.ProjectGroup).ThenInclude(g => g.Course)
            .Include(a => a.Alerts)
            .FirstOrDefaultAsync(a => a.ProjectGroupId == projectGroupId);

        if (assessment == null) throw new ArgumentException("No risk assessment found for this group");

        var memberIds = assessment.ProjectGroup.Members.Select(m => m.UserId).ToList();
        var workspaceIds = await _db.WorkspaceMembers
            .Where(wm => memberIds.Contains(wm.UserId))
            .Select(wm => wm.WorkspaceId)
            .Distinct()
            .ToListAsync();

        var memberActivities = await _db.ContributionRecords
            .Where(c => memberIds.Contains(c.StudentId))
            .GroupBy(c => c.StudentId)
            .Select(g => new MemberActivityInfo { UserId = g.Key, LastActivity = g.Max(c => c.CreatedAt), Count = g.Count() })
            .ToListAsync();

        var now = DateTime.UtcNow;
        var inactiveThreshold = now.AddDays(-InactiveMemberDays);

        var memberDetails = assessment.ProjectGroup.Members.Select(m =>
        {
            var activity = memberActivities.FirstOrDefault(a => a.UserId == m.UserId);
            var isActive = activity != null && activity.LastActivity >= inactiveThreshold;
            return new GroupMemberRiskDto
            {
                UserId = m.UserId,
                Name = m.User.FullName,
                AvatarUrl = m.User.AvatarUrl,
                TotalContributions = activity?.Count ?? 0,
                LastActivityAt = activity?.LastActivity,
                IsInactive = !isActive,
                DaysSinceActivity = activity != null ? (int)(now - activity.LastActivity).TotalDays : 999
            };
        }).ToList();

        var totalCards = assessment.ProjectGroup.Workspaces.SelectMany(w => w.Boards).SelectMany(b => b.Columns).SelectMany(c => c.Cards).Count();

        return new GroupRiskDetailDto
        {
            Assessment = MapAssessmentToDto(assessment, assessment.ProjectGroup, memberActivities,
                memberDetails.Count(m => m.IsInactive),
                assessment.ProjectGroup.Milestones.Count(m => !m.IsCompleted && m.DueDate < now),
                0, 0, 0),
            Members = memberDetails.OrderByDescending(m => m.IsInactive).ThenByDescending(m => m.DaysSinceActivity).ToArray(),
            Milestones = assessment.ProjectGroup.Milestones.OrderByDescending(m => m.DueDate).Select(m => new MilestoneRiskDto
            {
                Id = m.Id,
                Title = m.Title,
                DueDate = m.DueDate,
                Status = m.Status.ToString(),
                IsCompleted = m.IsCompleted,
                IsOverdue = !m.IsCompleted && m.DueDate < now,
                DaysOverdue = !m.IsCompleted && m.DueDate < now ? (int)(now - m.DueDate).TotalDays : 0
            }).ToArray(),
            TotalTasks = totalCards
        };
    }

    public async Task<AutoRefreshPayload> GetAutoRefreshAsync(DateTime? since = null)
    {
        var query = _db.RiskAssessments
            .Include(a => a.ProjectGroup)
            .Include(a => a.Alerts.Where(al => !al.IsAcknowledged))
            .AsQueryable();

        if (since.HasValue)
            query = query.Where(a => a.AssessedAt >= since.Value || a.Alerts.Any(al => al.CreatedAt >= since.Value));

        var assessments = await query.ToListAsync();

        return new AutoRefreshPayload
        {
            Timestamp = DateTime.UtcNow,
            Assessments = assessments.Select(a => new AssessmentSummary
            {
                ProjectGroupId = a.ProjectGroupId,
                GroupName = a.ProjectGroup.GroupName,
                RiskLevel = a.RiskLevel.ToString(),
                Score = a.OverallScore,
                NewAlerts = a.Alerts.Count(al => !al.IsAcknowledged)
            }).ToArray()
        };
    }

    private void GenerateAlerts(
        List<RiskAlert> alerts, Guid groupId,
        int inactiveScore, int inactiveCount, int totalMembers,
        List<Milestone> delayedMilestones, List<Milestone> approachingMilestones,
        int lowContribCount, int totalMemberCount,
        double commDaysSince, DateTime? lastMessageDate,
        double pendingPercent, int totalCards, int pendingCards,
        RiskLevel overallLevel)
    {
        // 1. Inactive Members
        if (inactiveCount > 0)
        {
            var level = inactiveCount > totalMembers / 2 ? RiskLevel.High : inactiveCount > 1 ? RiskLevel.Medium : RiskLevel.Low;
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.InactiveMembers,
                Severity = level,
                Title = $"{inactiveCount} inactive member{(inactiveCount > 1 ? "s" : "")}",
                Message = $"{inactiveCount} of {totalMembers} group member{(totalMembers > 1 ? "s" : "")} have no activity in the last {InactiveMemberDays} days.",
                Recommendation = "Consider reaching out to inactive members or reassigning their tasks. Review group engagement strategies."
            });
        }

        // 2. Delayed Milestones
        if (delayedMilestones.Count > 0)
        {
            foreach (var m in delayedMilestones)
            {
                var daysOverdue = (int)(DateTime.UtcNow - m.DueDate).TotalDays;
                alerts.Add(new RiskAlert
                {
                    ProjectGroupId = groupId,
                    Factor = RiskFactor.DelayedMilestones,
                    Severity = daysOverdue > 7 ? RiskLevel.High : daysOverdue > 3 ? RiskLevel.Medium : RiskLevel.Low,
                    Title = $"\"{m.Title}\" is overdue",
                    Message = $"Milestone \"{m.Title}\" was due {daysOverdue} day{(daysOverdue > 1 ? "s" : "")} ago.",
                    Recommendation = "Review milestone scope and adjust deadlines if needed. Consider breaking large milestones into smaller tasks."
                });
            }
        }

        if (approachingMilestones.Count > 0)
        {
            foreach (var m in approachingMilestones)
            {
                var daysUntil = (int)(m.DueDate - DateTime.UtcNow).TotalDays;
                alerts.Add(new RiskAlert
                {
                    ProjectGroupId = groupId,
                    Factor = RiskFactor.DelayedMilestones,
                    Severity = RiskLevel.Low,
                    Title = $"\"{m.Title}\" due in {daysUntil} day{(daysUntil != 1 ? "s" : "")}",
                    Message = $"Milestone \"{m.Title}\" is approaching its deadline.",
                    Recommendation = "Ensure the team is aware and on track. Provide support if progress is behind."
                });
            }
        }

        // 3. Low Contribution
        if (lowContribCount > 0)
        {
            var level = lowContribCount > totalMemberCount / 2 ? RiskLevel.High : lowContribCount > 1 ? RiskLevel.Medium : RiskLevel.Low;
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.LowContribution,
                Severity = level,
                Title = $"{lowContribCount} member{(lowContribCount > 1 ? "s" : "")} with low contribution",
                Message = $"{lowContribCount} of {totalMemberCount} members have contributed fewer than {LowContributionThreshold} tasks.",
                Recommendation = "Review task distribution. Consider pairing low contributors with active members for mentoring."
            });
        }

        // 4. Communication Breakdown
        if (commDaysSince >= CommunicationBreakdownDays)
        {
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.CommunicationBreakdown,
                Severity = RiskLevel.High,
                Title = "No messages for 5+ days",
                Message = $"Last message was {Math.Floor(commDaysSince)} days ago. Communication has stopped.",
                Recommendation = "Initiate a team check-in. Create a dedicated communication channel and set up regular standups."
            });
        }
        else if (commDaysSince >= 3)
        {
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.CommunicationBreakdown,
                Severity = RiskLevel.Medium,
                Title = $"Communication gap: {Math.Floor(commDaysSince)} days",
                Message = $"Last message was {Math.Floor(commDaysSince)} days ago.",
                Recommendation = "Encourage more frequent communication. Consider scheduling a sync meeting."
            });
        }

        // 5. Task Bottlenecks
        if (pendingPercent >= PendingTaskCriticalPercent && totalCards > 0)
        {
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.TaskBottleneck,
                Severity = RiskLevel.High,
                Title = $"Task bottleneck: {Math.Round(pendingPercent)}% pending",
                Message = $"{pendingCards} of {totalCards} tasks are still pending. Very few completed.",
                Recommendation = "Review task assignments and priorities. Consider reducing WIP limits and focusing on completing current tasks."
            });
        }
        else if (pendingPercent >= PendingTaskWarningPercent && totalCards > 0)
        {
            alerts.Add(new RiskAlert
            {
                ProjectGroupId = groupId,
                Factor = RiskFactor.TaskBottleneck,
                Severity = RiskLevel.Medium,
                Title = $"High pending tasks: {Math.Round(pendingPercent)}%",
                Message = $"{pendingCards} of {totalCards} tasks are pending.",
                Recommendation = "Review task priorities. Focus on completing in-progress tasks before starting new ones."
            });
        }
    }

    private RiskAssessmentDto MapAssessmentToDto(
        RiskAssessment a, ProjectGroup group,
        List<MemberActivityInfo> memberActivities, int inactiveCount,
        int delayedCount, int lowContribCount, double commDaysSince, double pendingPercent)
    {
        return new RiskAssessmentDto
        {
            Id = a.Id,
            ProjectGroupId = a.ProjectGroupId,
            GroupName = group.GroupName,
            CourseName = group.Course?.CourseName,
            RiskLevel = a.RiskLevel.ToString(),
            OverallScore = a.OverallScore,
            FactorScores = new FactorScoresDto
            {
                InactiveMembers = a.InactiveMembersScore,
                DelayedMilestones = a.DelayedMilestonesScore,
                LowContribution = a.LowContributionScore,
                Communication = a.CommunicationScore,
                TaskBottleneck = a.TaskBottleneckScore
            },
            MemberCount = group.Members.Count,
            InactiveMemberCount = inactiveCount,
            DelayedMilestoneCount = delayedCount,
            TotalMilestones = group.Milestones.Count,
            AssessedAt = a.AssessedAt,
            AlertCount = a.Alerts?.Count(al => !al.IsAcknowledged) ?? 0
        };
    }

    private RiskAlertDto MapAlertToDto(RiskAlert a)
    {
        return new RiskAlertDto
        {
            Id = a.Id,
            ProjectGroupId = a.ProjectGroupId,
            GroupName = a.ProjectGroup?.GroupName,
            CourseName = a.ProjectGroup?.Course?.CourseName,
            Factor = a.Factor.ToString(),
            Severity = a.Severity.ToString(),
            Title = a.Title,
            Message = a.Message,
            Recommendation = a.Recommendation,
            IsAcknowledged = a.IsAcknowledged,
            AcknowledgedAt = a.AcknowledgedAt,
            CreatedAt = a.CreatedAt
        };
    }
}

// --- DTOs ---

public class RiskDashboardDto
{
    public int TotalGroups { get; set; }
    public int HighRiskGroups { get; set; }
    public int MediumRiskGroups { get; set; }
    public int LowRiskGroups { get; set; }
    public int UnassessedGroups { get; set; }
    public int TotalAlerts { get; set; }
    public int HighSeverityAlerts { get; set; }
    public int MediumSeverityAlerts { get; set; }
    public int LowSeverityAlerts { get; set; }
    public int TotalMilestones { get; set; }
    public int DelayedMilestones { get; set; }
    public double OverallHealth { get; set; }
}

public class RiskAssessmentDto
{
    public Guid Id { get; set; }
    public Guid ProjectGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? CourseName { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public int OverallScore { get; set; }
    public FactorScoresDto FactorScores { get; set; } = new();
    public int MemberCount { get; set; }
    public int InactiveMemberCount { get; set; }
    public int DelayedMilestoneCount { get; set; }
    public int TotalMilestones { get; set; }
    public DateTime AssessedAt { get; set; }
    public int AlertCount { get; set; }
}

public class FactorScoresDto
{
    public int InactiveMembers { get; set; }
    public int DelayedMilestones { get; set; }
    public int LowContribution { get; set; }
    public int Communication { get; set; }
    public int TaskBottleneck { get; set; }
}

public class RiskAlertDto
{
    public Guid Id { get; set; }
    public Guid ProjectGroupId { get; set; }
    public string? GroupName { get; set; }
    public string? CourseName { get; set; }
    public string Factor { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Recommendation { get; set; }
    public bool IsAcknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GroupRiskDetailDto
{
    public RiskAssessmentDto Assessment { get; set; } = new();
    public GroupMemberRiskDto[] Members { get; set; } = [];
    public MilestoneRiskDto[] Milestones { get; set; } = [];
    public int TotalTasks { get; set; }
}

public class GroupMemberRiskDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int TotalContributions { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public bool IsInactive { get; set; }
    public int DaysSinceActivity { get; set; }
}

public class MilestoneRiskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public bool IsOverdue { get; set; }
    public int DaysOverdue { get; set; }
}

public class AutoRefreshPayload
{
    public DateTime Timestamp { get; set; }
    public AssessmentSummary[] Assessments { get; set; } = [];
}

public class AssessmentSummary
{
    public Guid ProjectGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public int Score { get; set; }
    public int NewAlerts { get; set; }
}

public class MemberActivityInfo
{
    public Guid UserId { get; set; }
    public DateTime LastActivity { get; set; }
    public int Count { get; set; }
}
