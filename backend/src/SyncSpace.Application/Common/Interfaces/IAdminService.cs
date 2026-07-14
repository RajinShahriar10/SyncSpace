using SyncSpace.Application.Features.Admin.DTOs;

namespace SyncSpace.Application.Common.Interfaces;

public interface IAdminService
{
    // Overview
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken ct = default);

    // Users
    Task<PaginatedList<AdminUserDto>> GetUsersAsync(string? search, int page, int pageSize, CancellationToken ct = default);
    Task<AdminUserDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
    Task UpdateUserAsync(UpdateUserRequest request, CancellationToken ct = default);
    Task DeleteUserAsync(Guid userId, CancellationToken ct = default);

    // Workspaces
    Task<PaginatedList<AdminWorkspaceDto>> GetWorkspacesAsync(string? search, int page, int pageSize, CancellationToken ct = default);
    Task<AdminWorkspaceDto?> GetWorkspaceByIdAsync(Guid workspaceId, CancellationToken ct = default);
    Task UpdateWorkspaceAsync(UpdateWorkspaceRequest request, CancellationToken ct = default);
    Task DeleteWorkspaceAsync(Guid workspaceId, CancellationToken ct = default);

    // Documents
    Task<PaginatedList<AdminDocumentDto>> GetDocumentsAsync(Guid? workspaceId, string? search, int page, int pageSize, CancellationToken ct = default);
    Task<AdminDocumentDto?> GetDocumentByIdAsync(Guid documentId, CancellationToken ct = default);
    Task DeleteDocumentAsync(Guid documentId, CancellationToken ct = default);

    // Storage
    Task<StorageOverviewDto> GetStorageOverviewAsync(CancellationToken ct = default);

    // System Health
    Task<SystemHealthDto> GetSystemHealthAsync(CancellationToken ct = default);

    // Audit Logs
    Task<PaginatedList<AdminAuditLogDto>> GetAuditLogsAsync(string? action, Guid? userId, Guid? workspaceId, int page, int pageSize, CancellationToken ct = default);
}
