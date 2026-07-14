using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, HashSet<string>> _channelMembers = new();
    private static readonly ConcurrentDictionary<string, HashSet<string>> _dmMembers = new();
    private static readonly ConcurrentDictionary<string, TypingState> _typingStates = new();

    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public ChatHub(ICurrentUserService currentUser, IIdentityService identityService)
    {
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = _currentUser.UserId;
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId.Value}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = _currentUser.UserId?.ToString();

        foreach (var key in _channelMembers.Keys.ToList())
        {
            _channelMembers[key].Remove(Context.ConnectionId);
            if (_channelMembers[key].Count == 0)
                _channelMembers.TryRemove(key, out _);
            else
                await Clients.Group(key).SendAsync("UserLeft", new { UserId = userId, ChannelId = key });
        }

        foreach (var key in _dmMembers.Keys.ToList())
        {
            _dmMembers[key].Remove(Context.ConnectionId);
            if (_dmMembers[key].Count == 0)
                _dmMembers.TryRemove(key, out _);
        }

        CleanTypingStates(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        _channelMembers.AddOrUpdate(channelId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, set) => { set.Add(Context.ConnectionId); return set; });

        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);
        await Clients.Group(channelId).SendAsync("UserJoined", new
        {
            UserId = (_currentUser.UserId ?? Guid.Empty).ToString(),
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            ChannelId = channelId,
            ConnectionId = Context.ConnectionId
        });
    }

    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);

        if (_channelMembers.ContainsKey(channelId))
            _channelMembers[channelId].Remove(Context.ConnectionId);

        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);
        await Clients.Group(channelId).SendAsync("UserLeft", new
        {
            UserId = (_currentUser.UserId ?? Guid.Empty).ToString(),
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            ChannelId = channelId
        });
    }

    public async Task JoinDm(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"dm:{conversationId}");
        _dmMembers.AddOrUpdate(conversationId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, set) => { set.Add(Context.ConnectionId); return set; });
    }

    public async Task LeaveDm(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"dm:{conversationId}");
        if (_dmMembers.ContainsKey(conversationId))
            _dmMembers[conversationId].Remove(Context.ConnectionId);
    }

    public async Task SendMessage(string channelId, string content, string? threadId)
    {
        var userId = _currentUser.UserId ?? Guid.Empty;
        var user = await _identityService.GetUserInfoAsync(userId);

        await Clients.Group(channelId).SendAsync("ReceiveMessage", new
        {
            Id = Guid.NewGuid().ToString(),
            ChannelId = channelId,
            SenderId = userId.ToString(),
            SenderName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            SenderAvatarUrl = user?.AvatarUrl,
            Content = content,
            ThreadId = threadId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendTyping(string channelId, bool isTyping)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        var typingKey = $"{channelId}:{userId}";
        if (isTyping)
        {
            _typingStates[typingKey] = new TypingState
            {
                UserId = userId,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                ChannelId = channelId,
                ExpiresAt = DateTime.UtcNow.AddSeconds(5)
            };
        }
        else
        {
            _typingStates.TryRemove(typingKey, out _);
        }

        await Clients.Group(channelId).SendAsync("TypingIndicator", new
        {
            UserId = userId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            ChannelId = channelId,
            IsTyping = isTyping
        });
    }

    public async Task SendDmTyping(string conversationId, bool isTyping)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        await Clients.Group($"dm:{conversationId}").SendAsync("DmTyping", new
        {
            UserId = userId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            ConversationId = conversationId,
            IsTyping = isTyping
        });
    }

    public async Task EditMessage(string channelId, string messageId, string newContent)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group(channelId).SendAsync("MessageEdited", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            Content = newContent,
            EditedBy = userId,
            EditedAt = DateTime.UtcNow
        });
    }

    public async Task DeleteMessage(string channelId, string messageId)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group(channelId).SendAsync("MessageDeleted", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            DeletedBy = userId,
            DeletedAt = DateTime.UtcNow
        });
    }

    public async Task PinMessage(string channelId, string messageId, bool isPinned)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group(channelId).SendAsync("MessagePinned", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            IsPinned = isPinned,
            PinnedBy = userId,
            PinnedAt = DateTime.UtcNow
        });
    }

    public async Task AddReaction(string channelId, string messageId, string emoji)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        await Clients.Group(channelId).SendAsync("ReactionAdded", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            Emoji = emoji,
            UserId = userId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown"
        });
    }

    public async Task RemoveReaction(string channelId, string messageId, string emoji)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group(channelId).SendAsync("ReactionRemoved", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            Emoji = emoji,
            UserId = userId
        });
    }

    public async Task SendDmMessage(string conversationId, string content, string? replyToId)
    {
        var userId = _currentUser.UserId ?? Guid.Empty;
        var user = await _identityService.GetUserInfoAsync(userId);

        await Clients.Group($"dm:{conversationId}").SendAsync("ReceiveDm", new
        {
            Id = Guid.NewGuid().ToString(),
            ConversationId = conversationId,
            SenderId = userId.ToString(),
            SenderName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            SenderAvatarUrl = user?.AvatarUrl,
            Content = content,
            ReplyToId = replyToId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task ReadDm(string conversationId)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group($"dm:{conversationId}").SendAsync("DmRead", new
        {
            ConversationId = conversationId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });
    }

    public async Task AddDmReaction(string conversationId, string messageId, string emoji)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        await Clients.Group($"dm:{conversationId}").SendAsync("DmReactionAdded", new
        {
            MessageId = messageId,
            ConversationId = conversationId,
            Emoji = emoji,
            UserId = userId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown"
        });
    }

    public async Task ReadChannelMessage(string channelId, string messageId)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.Group(channelId).SendAsync("MessageRead", new
        {
            MessageId = messageId,
            ChannelId = channelId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });
    }

    private void CleanTypingStates(string connectionId)
    {
        var keysToRemove = _typingStates
            .Where(kvp => kvp.Value.ConnectionId == connectionId)
            .Select(kvp => kvp.Key).ToList();
        foreach (var key in keysToRemove)
            _typingStates.TryRemove(key, out _);
    }
}

internal class TypingState
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string ChannelId { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
