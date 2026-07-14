using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Chat.DTOs;
using SyncSpace.Application.Features.Chat.Commands;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Chat.Queries;

public class GetWorkspaceChannelsQueryHandler : IRequestHandler<GetWorkspaceChannelsQuery, ApiResponse<List<ChannelDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetWorkspaceChannelsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<List<ChannelDto>>> Handle(GetWorkspaceChannelsQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var channels = (await _unitOfWork.Repository<Channel>().GetAllAsync(ct))
            .Where(c => c.WorkspaceId == request.WorkspaceId).ToList();

        var members = await _unitOfWork.Repository<ChannelMember>().GetAllAsync(ct);
        var messages = await _unitOfWork.Repository<Message>().GetAllAsync(ct);

        var dtos = channels.Select(ch =>
        {
            var chMembers = members.Count(m => m.ChannelId == ch.Id);
            var lastMsg = messages.Where(m => m.ChannelId == ch.Id).OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            var member = members.FirstOrDefault(m => m.ChannelId == ch.Id && userId.HasValue && m.UserId == userId.Value);
            var unread = member != null ? messages.Count(m => m.ChannelId == ch.Id && m.CreatedAt > member.LastReadAt && m.SenderId != userId) : 0;

            return new ChannelDto
            {
                Id = ch.Id,
                Name = ch.Name,
                Description = ch.Description,
                WorkspaceId = ch.WorkspaceId,
                IsPrivate = ch.IsPrivate,
                MemberCount = chMembers,
                UnreadCount = unread,
                CreatedAt = ch.CreatedAt
            };
        }).OrderBy(c => c.Name).ToList();

        return ApiResponse<List<ChannelDto>>.SuccessResponse(dtos);
    }
}

public class GetChannelQueryHandler : IRequestHandler<GetChannelQuery, ApiResponse<ChannelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetChannelQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ChannelDto>> Handle(GetChannelQuery request, CancellationToken ct)
    {
        var channel = await _unitOfWork.Repository<Channel>().GetByIdAsync(request.Id, ct);
        if (channel == null) return ApiResponse<ChannelDto>.NotFound("Channel not found.");

        var members = await _unitOfWork.Repository<ChannelMember>().GetAllAsync(ct);
        var messages = await _unitOfWork.Repository<Message>().GetAllAsync(ct);

        var memberCount = members.Count(m => m.ChannelId == channel.Id);
        var lastMsg = messages.Where(m => m.ChannelId == channel.Id).OrderByDescending(m => m.CreatedAt).FirstOrDefault();

        return ApiResponse<ChannelDto>.SuccessResponse(new ChannelDto
        {
            Id = channel.Id,
            Name = channel.Name,
            Description = channel.Description,
            WorkspaceId = channel.WorkspaceId,
            IsPrivate = channel.IsPrivate,
            MemberCount = memberCount,
            CreatedAt = channel.CreatedAt
        });
    }
}

public class GetChannelMessagesQueryHandler : IRequestHandler<GetChannelMessagesQuery, ApiResponse<List<MessageDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetChannelMessagesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<MessageDto>>> Handle(GetChannelMessagesQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? Guid.Empty;
        DateTime? beforeDate = null;
        if (request.Before.HasValue)
        {
            var beforeMsg = await _unitOfWork.Repository<Message>().GetByIdAsync(request.Before.Value, ct);
            beforeDate = beforeMsg?.CreatedAt;
        }

        var allMsgs = (await _unitOfWork.Repository<Message>().GetAllAsync(ct))
            .Where(m => m.ChannelId == request.ChannelId && m.ThreadId == null);

        if (beforeDate.HasValue)
            allMsgs = allMsgs.Where(m => m.CreatedAt < beforeDate.Value);

        var msgs = allMsgs.OrderByDescending(m => m.CreatedAt).Take(request.Limit).Reverse().ToList();
        var allReactions = await _unitOfWork.Repository<Reaction>().GetAllAsync(ct);
        var allAttachments = await _unitOfWork.Repository<Attachment>().GetAllAsync(ct);
        var allReceipts = await _unitOfWork.Repository<MessageReadReceipt>().GetAllAsync(ct);

        var dtos = new List<MessageDto>();
        foreach (var msg in msgs)
        {
            var sender = await _identityService.GetUserInfoAsync(msg.SenderId);
            var reactions = allReactions.Where(r => r.MessageId == msg.Id)
                .GroupBy(r => r.Emoji).Select(g => new ReactionDto
                {
                    Emoji = g.Key,
                    Count = g.Count(),
                    Me = g.Any(r => r.UserId == userId)
                }).ToList();
            var attachments = allAttachments.Where(a => a.MessageId == msg.Id)
                .Select(a => new AttachmentDto { Id = a.Id, Filename = a.Filename, Url = a.Url, Size = a.Size, MimeType = a.MimeType }).ToList();
            var replyCount = msgs.Count() > 0 ? (await _unitOfWork.Repository<Message>().GetAllAsync(ct)).Count(m => m.ThreadId == msg.Id) : 0;

            dtos.Add(ChatMapper.MapMessage(msg, sender, reactions, attachments, replyCount, userId));
        }

        return ApiResponse<List<MessageDto>>.SuccessResponse(dtos);
    }
}

public class GetChannelMembersQueryHandler : IRequestHandler<GetChannelMembersQuery, ApiResponse<List<ChatMemberDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetChannelMembersQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<ChatMemberDto>>> Handle(GetChannelMembersQuery request, CancellationToken ct)
    {
        var members = (await _unitOfWork.Repository<ChannelMember>().GetAllAsync(ct))
            .Where(m => m.ChannelId == request.ChannelId).ToList();

        var dtos = new List<ChatMemberDto>();
        foreach (var m in members)
        {
            var user = await _identityService.GetUserInfoAsync(m.UserId);
            if (user != null)
            {
                dtos.Add(new ChatMemberDto
                {
                    UserId = m.UserId,
                    Name = $"{user.FirstName} {user.LastName}",
                    AvatarUrl = user.AvatarUrl,
                    Email = user.Email,
                    Role = m.Role.ToString()
                });
            }
        }

        return ApiResponse<List<ChatMemberDto>>.SuccessResponse(dtos);
    }
}

public class GetChannelPinnedMessagesQueryHandler : IRequestHandler<GetChannelPinnedMessagesQuery, ApiResponse<List<MessageDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetChannelPinnedMessagesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<MessageDto>>> Handle(GetChannelPinnedMessagesQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? Guid.Empty;
        var msgs = (await _unitOfWork.Repository<Message>().GetAllAsync(ct))
            .Where(m => m.ChannelId == request.ChannelId && m.IsPinned)
            .OrderByDescending(m => m.PinnedAt).ToList();

        var allReactions = await _unitOfWork.Repository<Reaction>().GetAllAsync(ct);
        var allAttachments = await _unitOfWork.Repository<Attachment>().GetAllAsync(ct);

        var dtos = new List<MessageDto>();
        foreach (var msg in msgs)
        {
            var sender = await _identityService.GetUserInfoAsync(msg.SenderId);
            var reactions = allReactions.Where(r => r.MessageId == msg.Id)
                .GroupBy(r => r.Emoji).Select(g => new ReactionDto { Emoji = g.Key, Count = g.Count(), Me = g.Any(r => r.UserId == userId) }).ToList();
            var attachments = allAttachments.Where(a => a.MessageId == msg.Id)
                .Select(a => new AttachmentDto { Id = a.Id, Filename = a.Filename, Url = a.Url, Size = a.Size, MimeType = a.MimeType }).ToList();
            dtos.Add(ChatMapper.MapMessage(msg, sender, reactions, attachments, 0, userId));
        }

        return ApiResponse<List<MessageDto>>.SuccessResponse(dtos);
    }
}

// --- DM Queries ---

public class GetConversationsQueryHandler : IRequestHandler<GetConversationsQuery, ApiResponse<List<ConversationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetConversationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<ConversationDto>>> Handle(GetConversationsQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<List<ConversationDto>>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var convs = (await _unitOfWork.Repository<Conversation>().GetAllAsync(ct))
            .Where(c => c.WorkspaceId == request.WorkspaceId && (c.User1Id == userId.Value || c.User2Id == userId.Value))
            .OrderByDescending(c => c.LastMessageAt).ToList();

        var dmRepo = _unitOfWork.Repository<DirectMessage>();
        var allDms = await dmRepo.GetAllAsync(ct);
        var receipts = await _unitOfWork.Repository<DirectMessageReadReceipt>().GetAllAsync(ct);

        var dtos = new List<ConversationDto>();
        foreach (var conv in convs)
        {
            var otherUserId = conv.User1Id == userId.Value ? conv.User2Id : conv.User1Id;
            var otherUser = await _identityService.GetUserInfoAsync(otherUserId);
            var lastMsg = allDms.Where(m => m.ConversationId == conv.Id).OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            var unreadCount = allDms.Count(m => m.ConversationId == conv.Id && m.SenderId != userId.Value && !receipts.Any(r => r.MessageId == m.Id && r.UserId == userId.Value));

            DirectMessageDto? lastMsgDto = null;
            if (lastMsg != null)
            {
                var sender = await _identityService.GetUserInfoAsync(lastMsg.SenderId);
                lastMsgDto = ChatMapper.MapDm(lastMsg, sender, [], [], userId.Value);
            }

            dtos.Add(new ConversationDto
            {
                Id = conv.Id,
                OtherUserId = otherUserId,
                OtherUserName = otherUser != null ? $"{otherUser.FirstName} {otherUser.LastName}" : "Unknown",
                OtherUserAvatarUrl = otherUser?.AvatarUrl,
                UnreadCount = unreadCount,
                LastMessage = lastMsgDto,
                LastMessageAt = conv.LastMessageAt
            });
        }

        return ApiResponse<List<ConversationDto>>.SuccessResponse(dtos);
    }
}

public class GetOrCreateConversationQueryHandler : IRequestHandler<GetOrCreateConversationQuery, ApiResponse<ConversationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetOrCreateConversationQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<ConversationDto>> Handle(GetOrCreateConversationQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ConversationDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var convs = await _unitOfWork.Repository<Conversation>().GetAllAsync(ct);
        var existing = convs.FirstOrDefault(c =>
            c.WorkspaceId == request.WorkspaceId &&
            ((c.User1Id == userId.Value && c.User2Id == request.OtherUserId) ||
             (c.User1Id == request.OtherUserId && c.User2Id == userId.Value)));

        if (existing == null)
        {
            existing = new Conversation
            {
                WorkspaceId = request.WorkspaceId,
                User1Id = userId.Value,
                User2Id = request.OtherUserId,
                LastMessageAt = DateTime.UtcNow,
                CreatedBy = userId.Value.ToString()
            };
            await _unitOfWork.Repository<Conversation>().AddAsync(existing, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        var otherUser = await _identityService.GetUserInfoAsync(request.OtherUserId);
        return ApiResponse<ConversationDto>.SuccessResponse(new ConversationDto
        {
            Id = existing.Id,
            OtherUserId = request.OtherUserId,
            OtherUserName = otherUser != null ? $"{otherUser.FirstName} {otherUser.LastName}" : "Unknown",
            OtherUserAvatarUrl = otherUser?.AvatarUrl,
            LastMessageAt = existing.LastMessageAt
        });
    }
}

public class GetDirectMessagesQueryHandler : IRequestHandler<GetDirectMessagesQuery, ApiResponse<List<DirectMessageDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetDirectMessagesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<DirectMessageDto>>> Handle(GetDirectMessagesQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? Guid.Empty;
        var msgs = (await _unitOfWork.Repository<DirectMessage>().GetAllAsync(ct))
            .Where(m => m.ConversationId == request.ConversationId)
            .OrderByDescending(m => m.CreatedAt).Take(request.Limit).Reverse().ToList();

        var allReactions = await _unitOfWork.Repository<DirectMessageReaction>().GetAllAsync(ct);
        var allAttachments = await _unitOfWork.Repository<Attachment>().GetAllAsync(ct);

        var dtos = new List<DirectMessageDto>();
        foreach (var msg in msgs)
        {
            var sender = await _identityService.GetUserInfoAsync(msg.SenderId);
            var reactions = allReactions.Where(r => r.MessageId == msg.Id)
                .GroupBy(r => r.Emoji).Select(g => new DmReactionDto { Emoji = g.Key, Count = g.Count(), Me = g.Any(r => r.UserId == userId) }).ToList();
            var attachments = allAttachments.Where(a => a.MessageId == msg.Id)
                .Select(a => new AttachmentDto { Id = a.Id, Filename = a.Filename, Url = a.Url, Size = a.Size, MimeType = a.MimeType }).ToList();
            dtos.Add(ChatMapper.MapDm(msg, sender, reactions, attachments, userId));
        }

        return ApiResponse<List<DirectMessageDto>>.SuccessResponse(dtos);
    }
}
