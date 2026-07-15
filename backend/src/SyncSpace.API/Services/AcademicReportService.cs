using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Persistence.Context;

namespace SyncSpace.API.Services;

public interface IAcademicReportService
{
    Task<StudentReportDto> GetStudentReportAsync(Guid userId, Guid? courseId = null);
    Task<StudentActivityTrendDto[]> GetStudentActivityTrendAsync(Guid userId, int weeks = 12);
    Task<GroupReportDto> GetGroupReportAsync(Guid projectGroupId);
    Task<InstructorReportDto> GetInstructorReportAsync(Guid courseId);
    Task<SemesterSummaryDto> GetSemesterSummaryAsync(Guid courseId);
    Task<GroupRankingDto[]> GetGroupRankingsAsync(Guid courseId);
    Task<CourseStatsDto> GetCourseStatsAsync(Guid courseId);
}

public class AcademicReportService : IAcademicReportService
{
    private readonly SyncSpaceDbContext _db;

    public AcademicReportService(SyncSpaceDbContext db) => _db = db;

    public async Task<StudentReportDto> GetStudentReportAsync(Guid userId, Guid? courseId = null)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) throw new ArgumentException("User not found");

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        var groupsQuery = _db.ProjectGroupMembers
            .Where(m => m.UserId == userId)
            .Include(m => m.ProjectGroup).ThenInclude(g => g.Course)
            .AsQueryable();

        if (courseId.HasValue)
            groupsQuery = groupsQuery.Where(m => m.ProjectGroup.CourseId == courseId.Value);

        var memberships = await groupsQuery.ToListAsync();
        var groupIds = memberships.Select(m => m.ProjectGroup.Id).ToList();
        var workspaceIds = await _db.Workspaces
            .Where(w => groupIds.Contains(w.ProjectGroupId ?? Guid.Empty))
            .Select(w => w.Id)
            .ToListAsync();

        // Contribution records
        var contributions = await _db.ContributionRecords
            .Where(c => c.StudentId == userId && (courseId == null || (c.ProjectGroupId != null && groupIds.Contains(c.ProjectGroupId.Value))))
            .ToListAsync();

        var totalScore = contributions.Sum(c => c.Score);
        var tasksCompleted = contributions.Count(c => c.ActivityType == ContributionActivity.TaskCompleted.ToString());
        var tasksCreated = contributions.Count(c => c.ActivityType == ContributionActivity.TaskCreated.ToString());
        var documentsEdited = contributions.Count(c => c.ActivityType == ContributionActivity.DocumentEdited.ToString());
        var filesUploaded = contributions.Count(c => c.ActivityType == ContributionActivity.FileUploaded.ToString());
        var commentsAdded = contributions.Count(c => c.ActivityType == ContributionActivity.CommentAdded.ToString());
        var messagesSent = contributions.Count(c => c.ActivityType == ContributionActivity.MessageSent.ToString());

        var last30DaysScore = contributions.Where(c => c.CreatedAt >= thirtyDaysAgo).Sum(c => c.Score);

        // Activity trend (weekly for last 12 weeks)
        var weeklyActivity = new List<ReportWeeklyActivity>();
        for (int i = 11; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1));
            var weekEnd = now.AddDays(-7 * i);
            var weekScore = contributions.Where(c => c.CreatedAt >= weekStart && c.CreatedAt < weekEnd).Sum(c => c.Score);
            var weekTasks = contributions.Count(c => c.CreatedAt >= weekStart && c.CreatedAt < weekEnd && c.ActivityType == ContributionActivity.TaskCompleted.ToString());
            weeklyActivity.Add(new ReportWeeklyActivity
            {
                WeekStart = weekStart,
                WeekEnd = weekEnd,
                Score = weekScore,
                TasksCompleted = weekTasks,
                Label = weekStart.ToString("MMM d")
            });
        }

        // Group memberships
        var groupDetails = memberships.Select(m => new StudentGroupDetail
        {
            GroupId = m.ProjectGroup.Id,
            GroupName = m.ProjectGroup.GroupName,
            CourseName = m.ProjectGroup.Course?.CourseName ?? "Unknown",
            CourseCode = m.ProjectGroup.Course?.CourseCode ?? "",
            Role = m.UserId == m.ProjectGroup.LeaderId ? "Leader" : "Member"
        }).ToArray();

        // Milestones assigned
        var assignedMilestones = await _db.MilestoneAssignments
            .Where(a => a.UserId == userId)
            .Include(a => a.Milestone).ThenInclude(m => m.ProjectGroup)
            .ToListAsync();

        var completedMilestones = assignedMilestones.Count(a => a.Milestone.IsCompleted);
        var totalMilestones = assignedMilestones.Count;

        // Risk assessment
        var riskAssessments = await _db.RiskAssessments
            .Where(a => groupIds.Contains(a.ProjectGroupId))
            .ToListAsync();

        var avgRiskScore = riskAssessments.Any() ? riskAssessments.Average(a => a.OverallScore) : 0;
        var highestRisk = riskAssessments.Any() ? riskAssessments.Max(a => a.OverallScore) : 0;

        return new StudentReportDto
        {
            UserId = userId,
            FullName = user.FullName,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            GeneratedAt = now,
            Summary = new StudentSummary
            {
                TotalContributionScore = totalScore,
                Last30DaysScore = last30DaysScore,
                TasksCompleted = tasksCompleted,
                TasksCreated = tasksCreated,
                DocumentsEdited = documentsEdited,
                FilesUploaded = filesUploaded,
                CommentsAdded = commentsAdded,
                MessagesSent = messagesSent,
                TotalActivities = contributions.Count,
                MilestonesCompleted = completedMilestones,
                TotalMilestones = totalMilestones,
                GroupsCount = memberships.Count,
                AverageRiskScore = Math.Round(avgRiskScore, 1),
                HighestRiskScore = highestRisk
            },
            Groups = groupDetails,
            ActivityTrend = weeklyActivity.ToArray(),
            ContributionBreakdown = new ReportContributionBreakdown
            {
                TaskCompleted = tasksCompleted,
                TaskCreated = tasksCreated,
                DocumentEdited = documentsEdited,
                FileUploaded = filesUploaded,
                CommentAdded = commentsAdded,
                MessageSent = messagesSent
            }
        };
    }

    public async Task<StudentActivityTrendDto[]> GetStudentActivityTrendAsync(Guid userId, int weeks = 12)
    {
        var now = DateTime.UtcNow;
        var contributions = await _db.ContributionRecords
            .Where(c => c.StudentId == userId)
            .ToListAsync();

        var trend = new List<StudentActivityTrendDto>();
        for (int i = weeks - 1; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1));
            var weekEnd = now.AddDays(-7 * i);
            var weekContributions = contributions.Where(c => c.CreatedAt >= weekStart && c.CreatedAt < weekEnd);
            trend.Add(new StudentActivityTrendDto
            {
                WeekStart = weekStart,
                Label = weekStart.ToString("MMM d"),
                Score = weekContributions.Sum(c => c.Score),
                TasksCompleted = weekContributions.Count(c => c.ActivityType == ContributionActivity.TaskCompleted.ToString()),
                DocumentsEdited = weekContributions.Count(c => c.ActivityType == ContributionActivity.DocumentEdited.ToString()),
                FilesUploaded = weekContributions.Count(c => c.ActivityType == ContributionActivity.FileUploaded.ToString()),
                MessagesSent = weekContributions.Count(c => c.ActivityType == ContributionActivity.MessageSent.ToString())
            });
        }
        return trend.ToArray();
    }

    public async Task<GroupReportDto> GetGroupReportAsync(Guid projectGroupId)
    {
        var group = await _db.ProjectGroups
            .Include(g => g.Course)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Milestones)
            .Include(g => g.Workspaces).ThenInclude(w => w.Boards).ThenInclude(b => b.Columns).ThenInclude(c => c.Cards)
            .FirstOrDefaultAsync(g => g.Id == projectGroupId);

        if (group == null) throw new ArgumentException("Group not found");

        var memberIds = group.Members.Select(m => m.UserId).ToList();
        var workspaceIds = group.Workspaces.Select(w => w.Id).ToList();
        var now = DateTime.UtcNow;

        // Member contributions
        var contributions = await _db.ContributionRecords
            .Where(c => memberIds.Contains(c.StudentId) && workspaceIds.Contains(c.WorkspaceId ?? Guid.Empty))
            .ToListAsync();

        var memberContributions = group.Members.Select(m =>
        {
            var memberContribs = contributions.Where(c => c.StudentId == m.UserId);
            return new MemberContributionDto
            {
                UserId = m.UserId,
                FullName = m.User.FullName,
                AvatarUrl = m.User.AvatarUrl,
                IsLeader = m.UserId == group.LeaderId,
                TotalScore = memberContribs.Sum(c => c.Score),
                TasksCompleted = memberContribs.Count(c => c.ActivityType == ContributionActivity.TaskCompleted.ToString()),
                DocumentsEdited = memberContribs.Count(c => c.ActivityType == ContributionActivity.DocumentEdited.ToString()),
                FilesUploaded = memberContribs.Count(c => c.ActivityType == ContributionActivity.FileUploaded.ToString()),
                CommentsAdded = memberContribs.Count(c => c.ActivityType == ContributionActivity.CommentAdded.ToString()),
                MessagesSent = memberContribs.Count(c => c.ActivityType == ContributionActivity.MessageSent.ToString()),
                LastActiveAt = memberContribs.Any() ? memberContribs.Max(c => c.CreatedAt) : (DateTime?)null,
                ContributionPercent = contributions.Any() ? Math.Round((double)(memberContribs.Sum(c => c.Score) / contributions.Sum(c => c.Score) * 100), 1) : 0
            };
        }).OrderByDescending(m => m.TotalScore).ToArray();

        // Milestones
        var completedMilestones = group.Milestones.Count(m => m.IsCompleted);
        var totalMilestones = group.Milestones.Count;
        var delayedMilestones = group.Milestones.Count(m => !m.IsCompleted && m.DueDate < now);

        // Tasks
        var allCards = group.Workspaces.SelectMany(w => w.Boards).SelectMany(b => b.Columns).SelectMany(c => c.Cards).ToList();
        var totalTasks = allCards.Count;
        var doneTasks = allCards.Count(c => c.Column.Name.Contains("Done", StringComparison.OrdinalIgnoreCase) || c.Column.Name.Contains("Complete", StringComparison.OrdinalIgnoreCase));

        // Risk
        var riskAssessment = await _db.RiskAssessments.FirstOrDefaultAsync(a => a.ProjectGroupId == projectGroupId);

        // Activity trend
        var weeklyActivity = new List<ReportWeeklyActivity>();
        for (int i = 11; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1));
            var weekEnd = now.AddDays(-7 * i);
            var weekScore = contributions.Where(c => c.CreatedAt >= weekStart && c.CreatedAt < weekEnd).Sum(c => c.Score);
            weeklyActivity.Add(new ReportWeeklyActivity
            {
                WeekStart = weekStart,
                WeekEnd = weekEnd,
                Score = weekScore,
                Label = weekStart.ToString("MMM d")
            });
        }

        return new GroupReportDto
        {
            ProjectGroupId = projectGroupId,
            GroupName = group.GroupName,
            CourseName = group.Course?.CourseName ?? "Unknown",
            CourseCode = group.Course?.CourseCode ?? "",
            LeaderName = group.Members.FirstOrDefault(m => m.UserId == group.LeaderId)?.User?.FullName ?? "Unknown",
            GeneratedAt = now,
            Progress = new GroupProgressDto
            {
                TotalTasks = totalTasks,
                CompletedTasks = doneTasks,
                TaskCompletionPercent = totalTasks > 0 ? Math.Round((double)doneTasks / totalTasks * 100, 1) : 0,
                TotalMilestones = totalMilestones,
                CompletedMilestones = completedMilestones,
                DelayedMilestones = delayedMilestones,
                MilestoneCompletionPercent = totalMilestones > 0 ? Math.Round((double)completedMilestones / totalMilestones * 100, 1) : 0
            },
            Members = memberContributions,
            ContributionDistribution = memberContributions.Select(m => new ContributionDistributionItem
            {
                Name = m.FullName,
                Score = m.TotalScore,
                Percent = m.ContributionPercent
            }).ToArray(),
            RiskSummary = riskAssessment != null ? new GroupRiskSummaryDto
            {
                RiskLevel = riskAssessment.RiskLevel.ToString(),
                OverallScore = riskAssessment.OverallScore,
                InactiveMembers = riskAssessment.InactiveMembersScore,
                DelayedMilestones = riskAssessment.DelayedMilestonesScore,
                LowContribution = riskAssessment.LowContributionScore,
                Communication = riskAssessment.CommunicationScore,
                TaskBottleneck = riskAssessment.TaskBottleneckScore
            } : null,
            ActivityTrend = weeklyActivity.ToArray()
        };
    }

    public async Task<InstructorReportDto> GetInstructorReportAsync(Guid courseId)
    {
        var course = await _db.Courses.FindAsync(courseId);
        if (course == null) throw new ArgumentException("Course not found");

        var groups = await _db.ProjectGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Milestones)
            .Where(g => g.CourseId == courseId)
            .ToListAsync();

        var allMemberIds = groups.SelectMany(g => g.Members).Select(m => m.UserId).Distinct().ToList();
        var workspaceIds = await _db.Workspaces
            .Where(w => groups.Select(g => g.Id).Contains(w.ProjectGroupId ?? Guid.Empty))
            .Select(w => w.Id)
            .ToListAsync();

        var contributions = await _db.ContributionRecords
            .Where(c => allMemberIds.Contains(c.StudentId) && workspaceIds.Contains(c.WorkspaceId ?? Guid.Empty))
            .ToListAsync();

        var now = DateTime.UtcNow;

        // Group rankings
        var groupRankings = groups.Select(g =>
        {
            var gMemberIds = g.Members.Select(m => m.UserId).ToList();
            var gContribs = contributions.Where(c => gMemberIds.Contains(c.StudentId));
            var totalScore = gContribs.Sum(c => c.Score);
            var completedMilestones = g.Milestones.Count(m => m.IsCompleted);
            var totalMilestones = g.Milestones.Count;

            return new GroupRankingDto
            {
                ProjectGroupId = g.Id,
                GroupName = g.GroupName,
                MemberCount = g.Members.Count,
                TotalScore = totalScore,
                AverageScore = g.Members.Count > 0 ? Math.Round(totalScore / g.Members.Count, 1) : 0,
                CompletedMilestones = completedMilestones,
                TotalMilestones = totalMilestones,
                MilestonePercent = totalMilestones > 0 ? Math.Round((double)completedMilestones / totalMilestones * 100, 1) : 0,
                Rank = 0
            };
        }).OrderByDescending(g => g.TotalScore).ToList();

        for (int i = 0; i < groupRankings.Count; i++)
            groupRankings[i].Rank = i + 1;

        // Participation analytics
        var totalStudents = allMemberIds.Count;
        var activeStudents = contributions.Where(c => c.CreatedAt >= now.AddDays(-7)).Select(c => c.StudentId).Distinct().Count();
        var totalTasks = contributions.Count(c => c.ActivityType == ContributionActivity.TaskCompleted.ToString());
        var totalDocuments = contributions.Count(c => c.ActivityType == ContributionActivity.DocumentEdited.ToString());

        var allMilestones = groups.SelectMany(g => g.Milestones).ToList();
        var completedMilestones = allMilestones.Count(m => m.IsCompleted);
        var delayedMilestones = allMilestones.Count(m => !m.IsCompleted && m.DueDate < now);

        // Activity trend
        var weeklyActivity = new List<ReportWeeklyActivity>();
        for (int i = 11; i >= 0; i--)
        {
            var weekStart = now.AddDays(-7 * (i + 1));
            var weekEnd = now.AddDays(-7 * i);
            var weekScore = contributions.Where(c => c.CreatedAt >= weekStart && c.CreatedAt < weekEnd).Sum(c => c.Score);
            weeklyActivity.Add(new ReportWeeklyActivity
            {
                WeekStart = weekStart,
                WeekEnd = weekEnd,
                Score = weekScore,
                Label = weekStart.ToString("MMM d")
            });
        }

        return new InstructorReportDto
        {
            CourseId = courseId,
            CourseName = course.CourseName,
            CourseCode = course.CourseCode,
            Semester = course.Semester,
            GeneratedAt = now,
            Stats = new CourseStatsDto
            {
                CourseId = courseId,
                CourseName = course.CourseName,
                TotalGroups = groups.Count,
                TotalStudents = totalStudents,
                ActiveStudents = activeStudents,
                ParticipationRate = totalStudents > 0 ? Math.Round((double)activeStudents / totalStudents * 100, 1) : 0,
                TotalTasksCompleted = totalTasks,
                TotalDocumentsEdited = totalDocuments,
                TotalMilestones = allMilestones.Count,
                CompletedMilestones = completedMilestones,
                DelayedMilestones = delayedMilestones,
                MilestoneCompletionRate = allMilestones.Count > 0 ? Math.Round((double)completedMilestones / allMilestones.Count * 100, 1) : 0,
                TotalContributionScore = contributions.Sum(c => c.Score)
            },
            GroupRankings = groupRankings.ToArray(),
            ActivityTrend = weeklyActivity.ToArray(),
            ContributionBreakdown = new CourseContributionBreakdown
            {
                TasksCompleted = totalTasks,
                DocumentsEdited = totalDocuments,
                FilesUploaded = contributions.Count(c => c.ActivityType == ContributionActivity.FileUploaded.ToString()),
                CommentsAdded = contributions.Count(c => c.ActivityType == ContributionActivity.CommentAdded.ToString()),
                MessagesSent = contributions.Count(c => c.ActivityType == ContributionActivity.MessageSent.ToString())
            }
        };
    }

    public async Task<SemesterSummaryDto> GetSemesterSummaryAsync(Guid courseId)
    {
        var course = await _db.Courses.FindAsync(courseId);
        if (course == null) throw new ArgumentException("Course not found");

        var instructorReport = await GetInstructorReportAsync(courseId);

        // Top performers
        var groups = await _db.ProjectGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Where(g => g.CourseId == courseId)
            .ToListAsync();

        var allMemberIds = groups.SelectMany(g => g.Members).Select(m => m.UserId).Distinct().ToList();
        var workspaceIds = await _db.Workspaces
            .Where(w => groups.Select(g => g.Id).Contains(w.ProjectGroupId ?? Guid.Empty))
            .Select(w => w.Id)
            .ToListAsync();

        var contributions = await _db.ContributionRecords
            .Where(c => allMemberIds.Contains(c.StudentId) && workspaceIds.Contains(c.WorkspaceId ?? Guid.Empty))
            .ToListAsync();

        var studentPerformances = allMemberIds.Select(id =>
        {
            var user = groups.SelectMany(g => g.Members).FirstOrDefault(m => m.UserId == id)?.User;
            var contribs = contributions.Where(c => c.StudentId == id);
            return new StudentPerformanceSummary
            {
                UserId = id,
                FullName = user?.FullName ?? "Unknown",
                TotalScore = contribs.Sum(c => c.Score),
                TasksCompleted = contribs.Count(c => c.ActivityType == ContributionActivity.TaskCompleted.ToString()),
                GroupName = groups.FirstOrDefault(g => g.Members.Any(m => m.UserId == id))?.GroupName ?? ""
            };
        }).OrderByDescending(s => s.TotalScore).ToList();

        return new SemesterSummaryDto
        {
            CourseId = courseId,
            CourseName = course.CourseName,
            CourseCode = course.CourseCode,
            Semester = course.Semester,
            GeneratedAt = DateTime.UtcNow,
            Stats = instructorReport.Stats,
            GroupRankings = instructorReport.GroupRankings,
            TopPerformers = studentPerformances.Take(10).ToArray(),
            ActivityTrend = instructorReport.ActivityTrend,
            ContributionBreakdown = instructorReport.ContributionBreakdown
        };
    }

    public async Task<GroupRankingDto[]> GetGroupRankingsAsync(Guid courseId)
    {
        var report = await GetInstructorReportAsync(courseId);
        return report.GroupRankings;
    }

    public async Task<CourseStatsDto> GetCourseStatsAsync(Guid courseId)
    {
        var report = await GetInstructorReportAsync(courseId);
        return report.Stats;
    }
}

// --- DTOs ---

public class StudentReportDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime GeneratedAt { get; set; }
    public StudentSummary Summary { get; set; } = new();
    public StudentGroupDetail[] Groups { get; set; } = [];
    public ReportWeeklyActivity[] ActivityTrend { get; set; } = [];
    public ReportContributionBreakdown ContributionBreakdown { get; set; } = new();
}

public class StudentSummary
{
    public decimal TotalContributionScore { get; set; }
    public decimal Last30DaysScore { get; set; }
    public int TasksCompleted { get; set; }
    public int TasksCreated { get; set; }
    public int DocumentsEdited { get; set; }
    public int FilesUploaded { get; set; }
    public int CommentsAdded { get; set; }
    public int MessagesSent { get; set; }
    public int TotalActivities { get; set; }
    public int MilestonesCompleted { get; set; }
    public int TotalMilestones { get; set; }
    public int GroupsCount { get; set; }
    public double AverageRiskScore { get; set; }
    public int HighestRiskScore { get; set; }
}

public class StudentGroupDetail
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class ReportWeeklyActivity
{
    public DateTime WeekStart { get; set; }
    public DateTime WeekEnd { get; set; }
    public decimal Score { get; set; }
    public int TasksCompleted { get; set; }
    public string Label { get; set; } = string.Empty;
}

public class StudentActivityTrendDto
{
    public DateTime WeekStart { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int TasksCompleted { get; set; }
    public int DocumentsEdited { get; set; }
    public int FilesUploaded { get; set; }
    public int MessagesSent { get; set; }
}

public class ReportContributionBreakdown
{
    public int TaskCompleted { get; set; }
    public int TaskCreated { get; set; }
    public int DocumentEdited { get; set; }
    public int FileUploaded { get; set; }
    public int CommentAdded { get; set; }
    public int MessageSent { get; set; }
}

public class GroupReportDto
{
    public Guid ProjectGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string LeaderName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public GroupProgressDto Progress { get; set; } = new();
    public MemberContributionDto[] Members { get; set; } = [];
    public ContributionDistributionItem[] ContributionDistribution { get; set; } = [];
    public GroupRiskSummaryDto? RiskSummary { get; set; }
    public ReportWeeklyActivity[] ActivityTrend { get; set; } = [];
}

public class GroupProgressDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public double TaskCompletionPercent { get; set; }
    public int TotalMilestones { get; set; }
    public int CompletedMilestones { get; set; }
    public int DelayedMilestones { get; set; }
    public double MilestoneCompletionPercent { get; set; }
}

public class MemberContributionDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsLeader { get; set; }
    public decimal TotalScore { get; set; }
    public int TasksCompleted { get; set; }
    public int DocumentsEdited { get; set; }
    public int FilesUploaded { get; set; }
    public int CommentsAdded { get; set; }
    public int MessagesSent { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public double ContributionPercent { get; set; }
}

public class ContributionDistributionItem
{
    public string Name { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public double Percent { get; set; }
}

public class GroupRiskSummaryDto
{
    public string RiskLevel { get; set; } = string.Empty;
    public int OverallScore { get; set; }
    public int InactiveMembers { get; set; }
    public int DelayedMilestones { get; set; }
    public int LowContribution { get; set; }
    public int Communication { get; set; }
    public int TaskBottleneck { get; set; }
}

public class InstructorReportDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string? Semester { get; set; }
    public DateTime GeneratedAt { get; set; }
    public CourseStatsDto Stats { get; set; } = new();
    public GroupRankingDto[] GroupRankings { get; set; } = [];
    public ReportWeeklyActivity[] ActivityTrend { get; set; } = [];
    public CourseContributionBreakdown ContributionBreakdown { get; set; } = new();
}

public class CourseStatsDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int TotalGroups { get; set; }
    public int TotalStudents { get; set; }
    public int ActiveStudents { get; set; }
    public double ParticipationRate { get; set; }
    public int TotalTasksCompleted { get; set; }
    public int TotalDocumentsEdited { get; set; }
    public int TotalMilestones { get; set; }
    public int CompletedMilestones { get; set; }
    public int DelayedMilestones { get; set; }
    public double MilestoneCompletionRate { get; set; }
    public decimal TotalContributionScore { get; set; }
}

public class GroupRankingDto
{
    public Guid ProjectGroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public decimal TotalScore { get; set; }
    public decimal AverageScore { get; set; }
    public int CompletedMilestones { get; set; }
    public int TotalMilestones { get; set; }
    public double MilestonePercent { get; set; }
    public int Rank { get; set; }
}

public class CourseContributionBreakdown
{
    public int TasksCompleted { get; set; }
    public int DocumentsEdited { get; set; }
    public int FilesUploaded { get; set; }
    public int CommentsAdded { get; set; }
    public int MessagesSent { get; set; }
}

public class SemesterSummaryDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string? Semester { get; set; }
    public DateTime GeneratedAt { get; set; }
    public CourseStatsDto Stats { get; set; } = new();
    public GroupRankingDto[] GroupRankings { get; set; } = [];
    public StudentPerformanceSummary[] TopPerformers { get; set; } = [];
    public ReportWeeklyActivity[] ActivityTrend { get; set; } = [];
    public CourseContributionBreakdown ContributionBreakdown { get; set; } = new();
}

public class StudentPerformanceSummary
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public int TasksCompleted { get; set; }
    public string GroupName { get; set; } = string.Empty;
}
