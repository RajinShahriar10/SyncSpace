using MediatR;
using SyncSpace.Application.Common.Models;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Application.Features.Chat.DTOs;

// --- Channel Commands ---

public record CreateChannelCommand : IRequest<ApiResponse<ChannelDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsPrivate { get; init; }
}

public record UpdateChannelCommand : IRequest<ApiResponse<ChannelDto>>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
}

public record DeleteChannelCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

public record JoinChannelCommand : IRequest<ApiResponse<bool>>
{
    public Guid ChannelId { get; init; }
}

public record LeaveChannelCommand : IRequest<ApiResponse<bool>>
{
    public Guid ChannelId { get; init; }
}

// --- Message Commands ---

public record SendMessageCommand : IRequest<ApiResponse<MessageDto>>
{
    public Guid ChannelId { get; init; }
    public string Content { get; init; } = string.Empty;
    public Guid? ThreadId { get; init; }
}

public record EditMessageCommand : IRequest<ApiResponse<MessageDto>>
{
    public Guid MessageId { get; init; }
    public string Content { get; init; } = string.Empty;
}

public record DeleteMessageCommand : IRequest<ApiResponse<bool>>
{
    public Guid MessageId { get; init; }
}

public record PinMessageCommand : IRequest<ApiResponse<bool>>
{
    public Guid MessageId { get; init; }
    public bool IsPinned { get; init; }
}

public record AddReactionCommand : IRequest<ApiResponse<ReactionDto>>
{
    public Guid MessageId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

public record RemoveReactionCommand : IRequest<ApiResponse<bool>>
{
    public Guid MessageId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

public record MarkAsReadCommand : IRequest<ApiResponse<bool>>
{
    public Guid ChannelId { get; init; }
}

// --- DM Commands ---

public record SendDirectMessageCommand : IRequest<ApiResponse<DirectMessageDto>>
{
    public Guid ConversationId { get; init; }
    public string Content { get; init; } = string.Empty;
    public Guid? ReplyToId { get; init; }
}

public record EditDirectMessageCommand : IRequest<ApiResponse<DirectMessageDto>>
{
    public Guid MessageId { get; init; }
    public string Content { get; init; } = string.Empty;
}

public record DeleteDirectMessageCommand : IRequest<ApiResponse<bool>>
{
    public Guid MessageId { get; init; }
}

public record AddDmReactionCommand : IRequest<ApiResponse<DmReactionDto>>
{
    public Guid MessageId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

public record RemoveDmReactionCommand : IRequest<ApiResponse<bool>>
{
    public Guid MessageId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

public record MarkDmReadCommand : IRequest<ApiResponse<bool>>
{
    public Guid ConversationId { get; init; }
}

// --- Channel Queries ---

public record GetWorkspaceChannelsQuery : IRequest<ApiResponse<List<ChannelDto>>>
{
    public Guid WorkspaceId { get; init; }
}

public record GetChannelQuery : IRequest<ApiResponse<ChannelDto>>
{
    public Guid Id { get; init; }
}

public record GetChannelMessagesQuery : IRequest<ApiResponse<List<MessageDto>>>
{
    public Guid ChannelId { get; init; }
    public int Limit { get; init; } = 50;
    public Guid? Before { get; init; }
}

public record GetChannelMembersQuery : IRequest<ApiResponse<List<ChatMemberDto>>>
{
    public Guid ChannelId { get; init; }
}

public record GetChannelPinnedMessagesQuery : IRequest<ApiResponse<List<MessageDto>>>
{
    public Guid ChannelId { get; init; }
}

// --- DM Queries ---

public record GetConversationsQuery : IRequest<ApiResponse<List<ConversationDto>>>
{
    public Guid WorkspaceId { get; init; }
}

public record GetOrCreateConversationQuery : IRequest<ApiResponse<ConversationDto>>
{
    public Guid WorkspaceId { get; init; }
    public Guid OtherUserId { get; init; }
}

public record GetDirectMessagesQuery : IRequest<ApiResponse<List<DirectMessageDto>>>
{
    public Guid ConversationId { get; init; }
    public int Limit { get; init; } = 50;
}

// --- DTOs ---

public record ChannelDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid WorkspaceId { get; init; }
    public bool IsPrivate { get; init; }
    public int MemberCount { get; init; }
    public int UnreadCount { get; init; }
    public MessageDto? LastMessage { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record MessageDto
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
    public Guid ChannelId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string? SenderAvatarUrl { get; init; }
    public Guid? ThreadId { get; init; }
    public bool IsEdited { get; init; }
    public bool IsPinned { get; init; }
    public int ReplyCount { get; init; }
    public List<ReactionDto> Reactions { get; init; } = [];
    public List<AttachmentDto> Attachments { get; init; } = [];
    public List<ReadReceiptDto> ReadBy { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime? EditedAt { get; init; }
}

public record ReactionDto
{
    public string Emoji { get; init; } = string.Empty;
    public int Count { get; init; }
    public bool Me { get; init; }
}

public record AttachmentDto
{
    public Guid Id { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public long Size { get; init; }
    public string MimeType { get; init; } = string.Empty;
}

public record ReadReceiptDto
{
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public DateTime ReadAt { get; init; }
}

public record ChatMemberDto
{
    public Guid UserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = "Member";
    public bool IsOnline { get; set; }
}

public record ConversationDto
{
    public Guid Id { get; init; }
    public Guid OtherUserId { get; init; }
    public string OtherUserName { get; init; } = string.Empty;
    public string? OtherUserAvatarUrl { get; init; }
    public bool OtherUserOnline { get; init; }
    public int UnreadCount { get; init; }
    public DirectMessageDto? LastMessage { get; init; }
    public DateTime LastMessageAt { get; init; }
}

public record DirectMessageDto
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string? SenderAvatarUrl { get; init; }
    public string Content { get; init; } = string.Empty;
    public bool IsEdited { get; init; }
    public Guid? ReplyToId { get; init; }
    public List<DmReactionDto> Reactions { get; init; } = [];
    public List<AttachmentDto> Attachments { get; init; } = [];
    public List<ReadReceiptDto> ReadBy { get; init; } = [];
    public DateTime CreatedAt { get; init; }
}

public record DmReactionDto
{
    public string Emoji { get; init; } = string.Empty;
    public int Count { get; init; }
    public bool Me { get; init; }
}

public record TypingDto
{
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public bool IsTyping { get; init; }
}
