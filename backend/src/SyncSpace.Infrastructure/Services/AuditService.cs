using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _unitOfWork;

    public AuditService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(
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
        CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            WorkspaceId = workspaceId,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        await _unitOfWork.Repository<AuditLog>().AddAsync(log, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
