using SyncSpace.Application.Features.Search.DTOs;

namespace SyncSpace.Application.Common.Interfaces;

public interface ISearchService
{
    Task<SearchResult> SearchAsync(SearchRequest request, CancellationToken ct = default);
}
