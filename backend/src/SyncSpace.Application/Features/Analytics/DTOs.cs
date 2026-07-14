namespace SyncSpace.Application.Features.Analytics.DTOs;

public class WorkspaceOverviewDto
{
    public int ActiveUsers { get; set; }
    public int TotalMembers { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public double TaskCompletionRate { get; set; }
    public int TotalMessages { get; set; }
    public int TotalFiles { get; set; }
    public long TotalStorageBytes { get; set; }
    public int ActiveUsersLast7Days { get; set; }
}

public class WorkspaceGrowthDto
{
    public string Label { get; set; } = string.Empty;
    public int Members { get; set; }
    public int Documents { get; set; }
    public int Tasks { get; set; }
    public int Messages { get; set; }
}

public class TopMemberDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public int TaskCount { get; set; }
    public int DocumentCount { get; set; }
    public int MessageCount { get; set; }
    public int TotalActivity { get; set; }
}

public class TaskStatusDto
{
    public string ColumnName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TimelinePointDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}
