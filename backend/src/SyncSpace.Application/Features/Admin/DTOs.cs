namespace SyncSpace.Application.Features.Admin.DTOs;

public class PaginatedList<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalWorkspaces { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalMessages { get; set; }
    public int TotalFiles { get; set; }
    public long TotalStorageBytes { get; set; }
    public int TotalTasks { get; set; }
    public int UsersLast30Days { get; set; }
    public int DocumentsLast30Days { get; set; }
    public int MessagesLast30Days { get; set; }
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public int WorkspaceCount { get; set; }
    public int DocumentCount { get; set; }
    public int MessageCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class UpdateUserRequest
{
    public Guid Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Status { get; set; }
}

public class AdminWorkspaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int DocumentCount { get; set; }
    public int BoardCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateWorkspaceRequest
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class AdminDocumentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string WorkspaceName { get; set; } = string.Empty;
    public int WordCount { get; set; }
    public int CurrentVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class StorageOverviewDto
{
    public long TotalStorageBytes { get; set; }
    public int TotalFiles { get; set; }
    public List<StorageByWorkspaceDto> ByWorkspace { get; set; } = new();
    public List<StorageByTypeDto> ByType { get; set; } = new();
}

public class StorageByWorkspaceDto
{
    public Guid WorkspaceId { get; set; }
    public string WorkspaceName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int FileCount { get; set; }
}

public class StorageByTypeDto
{
    public string FileType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int FileCount { get; set; }
}

public class SystemHealthDto
{
    public string Status { get; set; } = "healthy";
    public bool DatabaseConnected { get; set; }
    public double DatabaseResponseMs { get; set; }
    public string RuntimeVersion { get; set; } = string.Empty;
    public string ServerTime { get; set; } = string.Empty;
    public long ProcessMemoryMB { get; set; }
    public int ThreadCount { get; set; }
    public int UptimeDays { get; set; }
    public Dictionary<string, string> Checks { get; set; } = new();
}

public class AdminAuditLogDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}
