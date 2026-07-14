using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Notifications.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Notifications.Commands;

// --- Create Notification ---

public class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, ApiResponse<NotificationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public CreateNotificationCommandHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<NotificationDto>> Handle(CreateNotificationCommand request, CancellationToken ct)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            ActionUrl = request.ActionUrl,
            CreatedBy = request.ActorId?.ToString() ?? "system"
        };

        await _unitOfWork.Repository<Notification>().AddAsync(notification, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        string? actorName = null;
        string? actorAvatarUrl = null;
        if (request.ActorId.HasValue)
        {
            var actor = await _identityService.GetUserInfoAsync(request.ActorId.Value);
            if (actor != null)
            {
                actorName = $"{actor.FirstName} {actor.LastName}";
                actorAvatarUrl = actor.AvatarUrl;
            }
        }

        return ApiResponse<NotificationDto>.SuccessResponse(new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type.ToString(),
            Title = notification.Title,
            Message = notification.Message,
            UserId = notification.UserId,
            IsRead = notification.IsRead,
            ActionUrl = notification.ActionUrl,
            ActorName = actorName,
            ActorAvatarUrl = actorAvatarUrl,
            CreatedAt = notification.CreatedAt
        });
    }
}

// --- Mark as Read ---

public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MarkAsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(MarkAsReadCommand request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<Notification>();
        var notification = await repo.GetByIdAsync(request.NotificationId, ct);
        if (notification == null) return ApiResponse<bool>.NotFound("Notification not found.");

        if (_currentUser.UserId.HasValue && notification.UserId != _currentUser.UserId.Value)
            return ApiResponse<bool>.Failure("Unauthorized.");

        notification.IsRead = true;
        repo.Update(notification);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Mark All as Read ---

public class MarkAllAsReadCommandHandler : IRequestHandler<MarkAllAsReadCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MarkAllAsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(MarkAllAsReadCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? request.UserId;
        var repo = _unitOfWork.Repository<Notification>();
        var unread = (await repo.GetAllAsync(ct))
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToList();

        foreach (var n in unread)
        {
            n.IsRead = true;
            repo.Update(n);
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Delete Notification ---

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteNotificationCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<Notification>();
        var notification = await repo.GetByIdAsync(request.NotificationId, ct);
        if (notification == null) return ApiResponse<bool>.NotFound("Notification not found.");

        if (_currentUser.UserId.HasValue && notification.UserId != _currentUser.UserId.Value)
            return ApiResponse<bool>.Failure("Unauthorized.");

        repo.Delete(notification);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}
