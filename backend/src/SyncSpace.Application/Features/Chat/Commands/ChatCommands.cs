using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Chat.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Chat.Commands;

// --- Channel Commands ---

public class CreateChannelCommandHandler : IRequestHandler<CreateChannelCommand, ApiResponse<ChannelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateChannelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ChannelDto>> Handle(CreateChannelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ChannelDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var channel = new Channel
        {
            Name = request.Name,
            Description = request.Description,
            WorkspaceId = request.WorkspaceId,
            IsPrivate = request.IsPrivate,
            CreatedById = userId.Value
        };

        await _unitOfWork.Repository<Channel>().AddAsync(channel, ct);

        await _unitOfWork.Repository<ChannelMember>().AddAsync(new ChannelMember
        {
            ChannelId = channel.Id,
            UserId = userId.Value,
            Role = ChannelMemberRole.Admin,
            CreatedBy = userId.Value.ToString()
        }, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<ChannelDto>.SuccessResponse(new ChannelDto
        {
            Id = channel.Id,
            Name = channel.Name,
            Description = channel.Description,
            WorkspaceId = channel.WorkspaceId,
            IsPrivate = channel.IsPrivate,
            MemberCount = 1,
            CreatedAt = channel.CreatedAt
        });
    }
}

public class UpdateChannelCommandHandler : IRequestHandler<UpdateChannelCommand, ApiResponse<ChannelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public UpdateChannelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ChannelDto>> Handle(UpdateChannelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ChannelDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Channel>();
        var channel = await repo.GetByIdAsync(request.Id, ct);
        if (channel == null) return ApiResponse<ChannelDto>.NotFound("Channel not found.");

        if (request.Name != null) channel.Name = request.Name;
        if (request.Description != null) channel.Description = request.Description;
        repo.Update(channel);
        await _unitOfWork.SaveChangesAsync(ct);

        var memberCount = (await _unitOfWork.Repository<ChannelMember>().GetAllAsync(ct)).Count(m => m.ChannelId == channel.Id);

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

public class DeleteChannelCommandHandler : IRequestHandler<DeleteChannelCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteChannelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteChannelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Channel>();
        var channel = await repo.GetByIdAsync(request.Id, ct);
        if (channel == null) return ApiResponse<bool>.NotFound("Channel not found.");

        var msgRepo = _unitOfWork.Repository<Message>();
        var msgs = (await msgRepo.GetAllAsync(ct)).Where(m => m.ChannelId == channel.Id);
        foreach (var m in msgs) msgRepo.Delete(m);

        var memberRepo = _unitOfWork.Repository<ChannelMember>();
        var members = (await memberRepo.GetAllAsync(ct)).Where(m => m.ChannelId == channel.Id);
        foreach (var m in members) memberRepo.Delete(m);

        repo.Delete(channel);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class JoinChannelCommandHandler : IRequestHandler<JoinChannelCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public JoinChannelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(JoinChannelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var existing = (await _unitOfWork.Repository<ChannelMember>().GetAllAsync(ct))
            .Any(m => m.ChannelId == request.ChannelId && m.UserId == userId.Value);
        if (existing) return ApiResponse<bool>.SuccessResponse(true);

        await _unitOfWork.Repository<ChannelMember>().AddAsync(new ChannelMember
        {
            ChannelId = request.ChannelId,
            UserId = userId.Value,
            CreatedBy = userId.Value.ToString()
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class LeaveChannelCommandHandler : IRequestHandler<LeaveChannelCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public LeaveChannelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(LeaveChannelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<ChannelMember>();
        var member = (await repo.GetAllAsync(ct)).FirstOrDefault(m => m.ChannelId == request.ChannelId && m.UserId == userId.Value);
        if (member == null) return ApiResponse<bool>.NotFound("Not a member.");

        repo.Delete(member);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Message Commands ---

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, ApiResponse<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public SendMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<MessageDto>> Handle(SendMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<MessageDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var msg = new Message
        {
            Content = request.Content,
            ChannelId = request.ChannelId,
            SenderId = userId.Value,
            ThreadId = request.ThreadId,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<Message>().AddAsync(msg, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        var replyCount = request.ThreadId == null
            ? (await _unitOfWork.Repository<Message>().GetAllAsync(ct)).Count(m => m.ThreadId == msg.Id)
            : 0;

        return ApiResponse<MessageDto>.SuccessResponse(ChatMapper.MapMessage(msg, user, [], [], replyCount, userId.Value));
    }
}

public class EditMessageCommandHandler : IRequestHandler<EditMessageCommand, ApiResponse<MessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public EditMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<MessageDto>> Handle(EditMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<MessageDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Message>();
        var msg = await repo.GetByIdAsync(request.MessageId, ct);
        if (msg == null) return ApiResponse<MessageDto>.NotFound("Message not found.");
        if (msg.SenderId != userId.Value) return ApiResponse<MessageDto>.Failure("Can only edit your own messages.");

        var oldContent = msg.Content;
        msg.Content = request.Content;
        msg.IsEdited = true;
        repo.Update(msg);

        await _unitOfWork.Repository<MessageEdit>().AddAsync(new MessageEdit
        {
            MessageId = msg.Id,
            OldContent = oldContent,
            NewContent = request.Content,
            EditedById = userId.Value,
            CreatedBy = userId.Value.ToString()
        }, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<MessageDto>.SuccessResponse(ChatMapper.MapMessage(msg, user, [], [], 0, userId.Value));
    }
}

public class DeleteMessageCommandHandler : IRequestHandler<DeleteMessageCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Message>();
        var msg = await repo.GetByIdAsync(request.MessageId, ct);
        if (msg == null) return ApiResponse<bool>.NotFound("Message not found.");

        repo.Delete(msg);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class PinMessageCommandHandler : IRequestHandler<PinMessageCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public PinMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(PinMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Message>();
        var msg = await repo.GetByIdAsync(request.MessageId, ct);
        if (msg == null) return ApiResponse<bool>.NotFound("Message not found.");

        msg.IsPinned = request.IsPinned;
        msg.PinnedById = request.IsPinned ? userId.Value : null;
        msg.PinnedAt = request.IsPinned ? DateTime.UtcNow : null;
        repo.Update(msg);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AddReactionCommandHandler : IRequestHandler<AddReactionCommand, ApiResponse<ReactionDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AddReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ReactionDto>> Handle(AddReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ReactionDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Reaction>();
        var all = await repo.GetAllAsync(ct);
        if (all.Any(r => r.MessageId == request.MessageId && r.UserId == userId.Value && r.Emoji == request.Emoji))
            return ApiResponse<ReactionDto>.Failure("Reaction already added.");

        await repo.AddAsync(new Reaction
        {
            MessageId = request.MessageId,
            UserId = userId.Value,
            Emoji = request.Emoji,
            CreatedBy = userId.Value.ToString()
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var reactions = (await repo.GetAllAsync(ct)).Where(r => r.MessageId == request.MessageId);
        var count = reactions.Count(r => r.Emoji == request.Emoji);

        return ApiResponse<ReactionDto>.SuccessResponse(new ReactionDto
        {
            Emoji = request.Emoji,
            Count = count,
            Me = true
        });
    }
}

public class RemoveReactionCommandHandler : IRequestHandler<RemoveReactionCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RemoveReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(RemoveReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Reaction>();
        var all = await repo.GetAllAsync(ct);
        var reaction = all.FirstOrDefault(r => r.MessageId == request.MessageId && r.UserId == userId.Value && r.Emoji == request.Emoji);
        if (reaction == null) return ApiResponse<bool>.NotFound("Reaction not found.");

        repo.Delete(reaction);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

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
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var memberRepo = _unitOfWork.Repository<ChannelMember>();
        var member = (await memberRepo.GetAllAsync(ct)).FirstOrDefault(m => m.ChannelId == request.ChannelId && m.UserId == userId.Value);
        if (member != null)
        {
            member.LastReadAt = DateTime.UtcNow;
            memberRepo.Update(member);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- DM Commands ---

public class SendDirectMessageCommandHandler : IRequestHandler<SendDirectMessageCommand, ApiResponse<DirectMessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public SendDirectMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DirectMessageDto>> Handle(SendDirectMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DirectMessageDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var conv = await _unitOfWork.Repository<Conversation>().GetByIdAsync(request.ConversationId, ct);
        if (conv == null) return ApiResponse<DirectMessageDto>.NotFound("Conversation not found.");

        var msg = new DirectMessage
        {
            ConversationId = request.ConversationId,
            SenderId = userId.Value,
            Content = request.Content,
            ReplyToId = request.ReplyToId,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<DirectMessage>().AddAsync(msg, ct);

        conv.LastMessageAt = DateTime.UtcNow;
        _unitOfWork.Repository<Conversation>().Update(conv);

        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DirectMessageDto>.SuccessResponse(ChatMapper.MapDm(msg, user, [], [], userId.Value));
    }
}

public class EditDirectMessageCommandHandler : IRequestHandler<EditDirectMessageCommand, ApiResponse<DirectMessageDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public EditDirectMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DirectMessageDto>> Handle(EditDirectMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DirectMessageDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DirectMessage>();
        var msg = await repo.GetByIdAsync(request.MessageId, ct);
        if (msg == null) return ApiResponse<DirectMessageDto>.NotFound("Message not found.");
        if (msg.SenderId != userId.Value) return ApiResponse<DirectMessageDto>.Failure("Can only edit your own messages.");

        msg.Content = request.Content;
        msg.IsEdited = true;
        repo.Update(msg);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DirectMessageDto>.SuccessResponse(ChatMapper.MapDm(msg, user, [], [], userId.Value));
    }
}

public class DeleteDirectMessageCommandHandler : IRequestHandler<DeleteDirectMessageCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteDirectMessageCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteDirectMessageCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DirectMessage>();
        var msg = await repo.GetByIdAsync(request.MessageId, ct);
        if (msg == null) return ApiResponse<bool>.NotFound("Message not found.");

        repo.Delete(msg);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AddDmReactionCommandHandler : IRequestHandler<AddDmReactionCommand, ApiResponse<DmReactionDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AddDmReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<DmReactionDto>> Handle(AddDmReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DmReactionDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DirectMessageReaction>();
        var all = await repo.GetAllAsync(ct);
        if (all.Any(r => r.MessageId == request.MessageId && r.UserId == userId.Value && r.Emoji == request.Emoji))
            return ApiResponse<DmReactionDto>.Failure("Reaction already added.");

        await repo.AddAsync(new DirectMessageReaction
        {
            MessageId = request.MessageId,
            UserId = userId.Value,
            Emoji = request.Emoji,
            CreatedBy = userId.Value.ToString()
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var count = (await repo.GetAllAsync(ct)).Count(r => r.MessageId == request.MessageId && r.Emoji == request.Emoji);
        return ApiResponse<DmReactionDto>.SuccessResponse(new DmReactionDto { Emoji = request.Emoji, Count = count, Me = true });
    }
}

public class RemoveDmReactionCommandHandler : IRequestHandler<RemoveDmReactionCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RemoveDmReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(RemoveDmReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DirectMessageReaction>();
        var all = await repo.GetAllAsync(ct);
        var reaction = all.FirstOrDefault(r => r.MessageId == request.MessageId && r.UserId == userId.Value && r.Emoji == request.Emoji);
        if (reaction == null) return ApiResponse<bool>.NotFound("Reaction not found.");

        repo.Delete(reaction);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class MarkDmReadCommandHandler : IRequestHandler<MarkDmReadCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public MarkDmReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(MarkDmReadCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var msgs = (await _unitOfWork.Repository<DirectMessage>().GetAllAsync(ct))
            .Where(m => m.ConversationId == request.ConversationId && m.SenderId != userId.Value);

        var receipts = await _unitOfWork.Repository<DirectMessageReadReceipt>().GetAllAsync(ct);
        var unreadMsgIds = msgs.Where(m => !receipts.Any(r => r.MessageId == m.Id && r.UserId == userId.Value)).Select(m => m.Id);

        foreach (var msgId in unreadMsgIds)
        {
            await _unitOfWork.Repository<DirectMessageReadReceipt>().AddAsync(new DirectMessageReadReceipt
            {
                MessageId = msgId,
                UserId = userId.Value,
                CreatedBy = userId.Value.ToString()
            }, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Helpers ---

internal static class ChatMapper
{
    public static MessageDto MapMessage(Message msg, UserInfo? sender, List<ReactionDto> reactions, List<AttachmentDto> attachments, int replyCount, Guid currentUserId)
    {
        return new MessageDto
        {
            Id = msg.Id,
            Content = msg.Content,
            ChannelId = msg.ChannelId,
            SenderId = msg.SenderId,
            SenderName = sender != null ? $"{sender.FirstName} {sender.LastName}" : "Unknown",
            SenderAvatarUrl = sender?.AvatarUrl,
            ThreadId = msg.ThreadId,
            IsEdited = msg.IsEdited,
            IsPinned = msg.IsPinned,
            ReplyCount = replyCount,
            Reactions = reactions,
            Attachments = attachments,
            CreatedAt = msg.CreatedAt
        };
    }

    public static DirectMessageDto MapDm(DirectMessage msg, UserInfo? sender, List<DmReactionDto> reactions, List<AttachmentDto> attachments, Guid currentUserId)
    {
        return new DirectMessageDto
        {
            Id = msg.Id,
            ConversationId = msg.ConversationId,
            SenderId = msg.SenderId,
            SenderName = sender != null ? $"{sender.FirstName} {sender.LastName}" : "Unknown",
            SenderAvatarUrl = sender?.AvatarUrl,
            Content = msg.Content,
            IsEdited = msg.IsEdited,
            ReplyToId = msg.ReplyToId,
            Reactions = reactions,
            Attachments = attachments,
            CreatedAt = msg.CreatedAt
        };
    }
}
