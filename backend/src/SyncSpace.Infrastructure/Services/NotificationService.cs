using Microsoft.AspNetCore.SignalR;
using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Notifications.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<Hub> _hubContext;

    public NotificationService(IUnitOfWork unitOfWork, IHubContext<Hub> hubContext)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(Guid userId, NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            ActionUrl = actionUrl,
            CreatedBy = actorId?.ToString() ?? "system"
        };

        await _unitOfWork.Repository<Notification>().AddAsync(notification, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        await _hubContext.Clients.Group($"notifications:{userId}").SendAsync("NewNotification", new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type.ToString(),
            Title = notification.Title,
            Message = notification.Message,
            UserId = notification.UserId,
            IsRead = false,
            ActionUrl = notification.ActionUrl,
            CreatedAt = notification.CreatedAt
        }, ct);
    }

    public async Task SendBulkNotificationAsync(IEnumerable<Guid> userIds, NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default)
    {
        var notifications = new List<Notification>();
        foreach (var userId in userIds)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                CreatedBy = actorId?.ToString() ?? "system"
            };
            notifications.Add(notification);
            await _unitOfWork.Repository<Notification>().AddAsync(notification, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        foreach (var notification in notifications)
        {
            await _hubContext.Clients.Group($"notifications:{notification.UserId}").SendAsync("NewNotification", new NotificationDto
            {
                Id = notification.Id,
                Type = notification.Type.ToString(),
                Title = notification.Title,
                Message = notification.Message,
                UserId = notification.UserId,
                IsRead = false,
                ActionUrl = notification.ActionUrl,
                CreatedAt = notification.CreatedAt
            }, ct);
        }
    }
}
