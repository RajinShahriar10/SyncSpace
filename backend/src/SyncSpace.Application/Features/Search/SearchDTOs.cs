namespace SyncSpace.Application.Features.Search.DTOs;

public record SearchRequest
{
    public string Query { get; init; } = string.Empty;
    public Guid WorkspaceId { get; init; }
    public Guid UserId { get; init; }
    public int Limit { get; init; } = 20;
    public string? Category { get; init; }
}

public record SearchResult
{
    public string Query { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public List<SearchCategoryResult> Categories { get; init; } = [];
    public long ElapsedMs { get; init; }
}

public record SearchCategoryResult
{
    public string Category { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public List<SearchItemResult> Items { get; init; } = [];
}

public record SearchItemResult
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Subtitle { get; init; }
    public string? Snippet { get; init; }
    public string? Url { get; init; }
    public double Score { get; init; }
    public string? Icon { get; init; }
    public DateTime CreatedAt { get; init; }
}
