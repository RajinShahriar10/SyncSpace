using System.Text.Json;
using StackExchange.Redis;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Search.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class CachedSearchService : ISearchService
{
    private readonly ISearchService _inner;
    private readonly IDatabase _redis;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(3);

    public CachedSearchService(ISearchService inner, IConnectionMultiplexer redis)
    {
        _inner = inner;
        _redis = redis.GetDatabase();
    }

    public async Task<SearchResult> SearchAsync(SearchRequest request, CancellationToken ct = default)
    {
        var key = $"search:{request.WorkspaceId}:{request.Query.Trim().ToLowerInvariant()}:{request.Category ?? "all"}:{request.Limit}";
        var cached = await _redis.StringGetAsync(key);
        if (cached.HasValue)
            return JsonSerializer.Deserialize<SearchResult>((string)cached!)!;

        var result = await _inner.SearchAsync(request, ct);
        await _redis.StringSetAsync(key, JsonSerializer.Serialize(result), CacheDuration);
        return result;
    }
}
