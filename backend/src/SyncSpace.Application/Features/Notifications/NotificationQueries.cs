using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Notifications.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Notifications.Queries;

public class GetUserNotificationsQueryHandler : IRequestHandler<GetUserNotificationsQuery, ApiResponse<List<NotificationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetUserNotificationsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<NotificationDto>>> Handle(GetUserNotificationsQuery request, CancellationToken ct)
    {
        var notifications = (await _unitOfWork.Repository<Notification>().GetAllAsync(ct))
            .Where(n => n.UserId == request.UserId);

        if (request.UnreadOnly)
            notifications = notifications.Where(n => !n.IsRead);

        var paged = notifications
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        // Cache actor info to avoid N+1
        var actorIds = paged.Where(n => !string.IsNullOrEmpty(n.CreatedBy) && Guid.TryParse(n.CreatedBy, out _))
            .Select(n => Guid.Parse(n.CreatedBy!))
            .Distinct().ToList();

        var actorCache = new Dictionary<Guid, Application.Common.Interfaces.UserInfo>();
        foreach (var actorId in actorIds)
        {
            var actor = await _identityService.GetUserInfoAsync(actorId);
            if (actor != null) actorCache[actorId] = actor;
        }

        var dtos = paged.Select(n =>
        {
            string? actorName = null;
            string? actorAvatarUrl = null;
            if (!string.IsNullOrEmpty(n.CreatedBy) && Guid.TryParse(n.CreatedBy, out var actorId) && actorCache.TryGetValue(actorId, out var actor))
            {
                actorName = $"{actor.FirstName} {actor.LastName}";
                actorAvatarUrl = actor.AvatarUrl;
            }

            return new NotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Title = n.Title,
                Message = n.Message,
                UserId = n.UserId,
                IsRead = n.IsRead,
                ActionUrl = n.ActionUrl,
                ActorName = actorName,
                ActorAvatarUrl = actorAvatarUrl,
                CreatedAt = n.CreatedAt
            };
        }).ToList();

        return ApiResponse<List<NotificationDto>>.SuccessResponse(dtos);
    }
}

public class GetNotificationSummaryQueryHandler : IRequestHandler<GetNotificationSummaryQuery, ApiResponse<NotificationSummaryDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetNotificationSummaryQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<NotificationSummaryDto>> Handle(GetNotificationSummaryQuery request, CancellationToken ct)
    {
        var all = (await _unitOfWork.Repository<Notification>().GetAllAsync(ct))
            .Where(n => n.UserId == request.UserId).ToList();

        var totalUnread = all.Count(n => !n.IsRead);
        var today = DateTime.UtcNow.Date;
        var totalToday = all.Count(n => n.CreatedAt >= today);

        var recent = all.OrderByDescending(n => n.CreatedAt).Take(5).ToList();

        var dtos = recent.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type.ToString(),
            Title = n.Title,
            Message = n.Message,
            UserId = n.UserId,
            IsRead = n.IsRead,
            ActionUrl = n.ActionUrl,
            CreatedAt = n.CreatedAt
        }).ToList();

        return ApiResponse<NotificationSummaryDto>.SuccessResponse(new NotificationSummaryDto
        {
            TotalUnread = totalUnread,
            TotalToday = totalToday,
            RecentNotifications = dtos
        });
    }
}
