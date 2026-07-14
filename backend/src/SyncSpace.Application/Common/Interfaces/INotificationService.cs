namespace SyncSpace.Application.Common.Interfaces;

using SyncSpace.Domain.Enums;

public interface INotificationService
{
    Task SendNotificationAsync(Guid userId, NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default);
    Task SendBulkNotificationAsync(IEnumerable<Guid> userIds, NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default);
}
