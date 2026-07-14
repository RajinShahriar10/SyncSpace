using System.Text.Json;
using StackExchange.Redis;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Analytics.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class CachedAnalyticsService : IAnalyticsService
{
    private readonly IAnalyticsService _inner;
    private readonly IDatabase _redis;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public CachedAnalyticsService(IAnalyticsService inner, IConnectionMultiplexer redis)
    {
        _inner = inner;
        _redis = redis.GetDatabase();
    }

    private async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, CancellationToken ct)
    {
        var cached = await _redis.StringGetAsync(key);
        if (cached.HasValue)
            return JsonSerializer.Deserialize<T>((string)cached!)!;

        var result = await factory();
        await _redis.StringSetAsync(key, JsonSerializer.Serialize(result), CacheDuration);
        return result;
    }

    public Task<WorkspaceOverviewDto> GetWorkspaceOverviewAsync(Guid workspaceId, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:overview:{workspaceId}", () => _inner.GetWorkspaceOverviewAsync(workspaceId, ct), ct);

    public Task<List<WorkspaceGrowthDto>> GetWorkspaceGrowthAsync(Guid workspaceId, int months, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:growth:{workspaceId}:{months}", () => _inner.GetWorkspaceGrowthAsync(workspaceId, months, ct), ct);

    public Task<List<TopMemberDto>> GetTopMembersAsync(Guid workspaceId, int limit, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:topmembers:{workspaceId}:{limit}", () => _inner.GetTopMembersAsync(workspaceId, limit, ct), ct);

    public Task<List<TaskStatusDto>> GetTaskStatusAsync(Guid workspaceId, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:tasks:{workspaceId}", () => _inner.GetTaskStatusAsync(workspaceId, ct), ct);

    public Task<List<TimelinePointDto>> GetDocumentCreationAsync(Guid workspaceId, int months, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:docs:{workspaceId}:{months}", () => _inner.GetDocumentCreationAsync(workspaceId, months, ct), ct);

    public Task<List<TimelinePointDto>> GetMessageActivityAsync(Guid workspaceId, int months, CancellationToken ct = default)
        => GetOrSetAsync($"analytics:msgs:{workspaceId}:{months}", () => _inner.GetMessageActivityAsync(workspaceId, months, ct), ct);
}
