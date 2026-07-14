using MediatR;
using SyncSpace.Application.Common.Models;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Application.Features.Notifications.DTOs;

// --- DTOs ---

public record NotificationDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public bool IsRead { get; init; }
    public string? ActionUrl { get; init; }
    public string? ActorName { get; init; }
    public string? ActorAvatarUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record NotificationSummaryDto
{
    public int TotalUnread { get; init; }
    public int TotalToday { get; init; }
    public List<NotificationDto> RecentNotifications { get; init; } = [];
}

// --- Commands ---

public record CreateNotificationCommand : IRequest<ApiResponse<NotificationDto>>
{
    public Guid UserId { get; init; }
    public NotificationType Type { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string? ActionUrl { get; init; }
    public Guid? ActorId { get; init; }
}

public record MarkAsReadCommand : IRequest<ApiResponse<bool>>
{
    public Guid NotificationId { get; init; }
}

public record MarkAllAsReadCommand : IRequest<ApiResponse<bool>>
{
    public Guid UserId { get; init; }
}

public record DeleteNotificationCommand : IRequest<ApiResponse<bool>>
{
    public Guid NotificationId { get; init; }
}

// --- Queries ---

public record GetUserNotificationsQuery : IRequest<ApiResponse<List<NotificationDto>>>
{
    public Guid UserId { get; init; }
    public bool UnreadOnly { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 30;
}

public record GetNotificationSummaryQuery : IRequest<ApiResponse<NotificationSummaryDto>>
{
    public Guid UserId { get; init; }
}
