using SyncSpace.Application.Features.Analytics.DTOs;

namespace SyncSpace.Application.Common.Interfaces;

public interface IAnalyticsService
{
    Task<WorkspaceOverviewDto> GetWorkspaceOverviewAsync(Guid workspaceId, CancellationToken ct = default);
    Task<List<WorkspaceGrowthDto>> GetWorkspaceGrowthAsync(Guid workspaceId, int months, CancellationToken ct = default);
    Task<List<TopMemberDto>> GetTopMembersAsync(Guid workspaceId, int limit, CancellationToken ct = default);
    Task<List<TaskStatusDto>> GetTaskStatusAsync(Guid workspaceId, CancellationToken ct = default);
    Task<List<TimelinePointDto>> GetDocumentCreationAsync(Guid workspaceId, int months, CancellationToken ct = default);
    Task<List<TimelinePointDto>> GetMessageActivityAsync(Guid workspaceId, int months, CancellationToken ct = default);
}
