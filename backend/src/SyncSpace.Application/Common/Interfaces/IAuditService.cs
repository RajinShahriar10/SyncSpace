using SyncSpace.Domain.Enums;

namespace SyncSpace.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        Guid userId,
        AuditAction action,
        string entityType,
        Guid? entityId,
        Guid? workspaceId,
        string description,
        string? oldValue = null,
        string? newValue = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken ct = default);
}
