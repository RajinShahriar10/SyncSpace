using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.API.Hubs;

public class DocumentHub : Hub
{
    private static readonly ConcurrentDictionary<string, HashSet<string>> _documentUsers = new();
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, CursorPosition>> _cursors = new();
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, UserPresence>> _presence = new();

    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public DocumentHub(ICurrentUserService currentUser, IIdentityService identityService)
    {
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = _currentUser.UserId?.ToString() ?? Context.ConnectionId;
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = Context.ConnectionId,
            UserId = userId,
            User = user != null ? new { user.FirstName, user.LastName, user.AvatarUrl } : null
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove from all document rooms
        var keysToRemove = _documentUsers
            .Where(kvp => kvp.Value.Contains(Context.ConnectionId))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var docId in keysToRemove)
        {
            _documentUsers[docId].Remove(Context.ConnectionId);
            if (_cursors.ContainsKey(docId))
                _cursors[docId].TryRemove(Context.ConnectionId, out _);
            if (_presence.ContainsKey(docId))
                _presence[docId].TryRemove(Context.ConnectionId, out _);

            await Clients.Group(docId).SendAsync("UserLeft", Context.ConnectionId);
            await BroadcastPresence(docId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinDocument(string documentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, documentId);

        _documentUsers.AddOrUpdate(documentId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, set) => { set.Add(Context.ConnectionId); return set; });

        _presence.AddOrUpdate(documentId,
            _ => new ConcurrentDictionary<string, UserPresence>(),
            (_, dict) => dict);

        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);
        var presence = new UserPresence
        {
            UserId = (_currentUser.UserId ?? Guid.Empty).ToString(),
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Anonymous",
            AvatarUrl = user?.AvatarUrl,
            ConnectionId = Context.ConnectionId,
            LastActive = DateTime.UtcNow
        };

        _presence[documentId][Context.ConnectionId] = presence;

        await Clients.Group(documentId).SendAsync("UserJoined", presence);
        await BroadcastPresence(documentId);
    }

    public async Task LeaveDocument(string documentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, documentId);

        if (_documentUsers.ContainsKey(documentId))
            _documentUsers[documentId].Remove(Context.ConnectionId);
        if (_cursors.ContainsKey(documentId))
            _cursors[documentId].TryRemove(Context.ConnectionId, out _);
        if (_presence.ContainsKey(documentId))
            _presence[documentId].TryRemove(Context.ConnectionId, out _);

        await Clients.Group(documentId).SendAsync("UserLeft", Context.ConnectionId);
        await BroadcastPresence(documentId);
    }

    public async Task SendContentUpdate(string documentId, string content, string title)
    {
        await Clients.Group(documentId).SendAsync("ContentUpdate", new
        {
            DocumentId = documentId,
            Content = content,
            Title = title,
            UpdatedBy = Context.ConnectionId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendCursorPosition(string documentId, int position, int selectionEnd)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        var user = await _identityService.GetUserInfoAsync(_currentUser.UserId ?? Guid.Empty);

        var cursor = new CursorPosition
        {
            UserId = userId,
            Position = position,
            SelectionEnd = selectionEnd,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Anonymous",
            Color = GetColorForUser(userId)
        };

        _cursors.AddOrUpdate(documentId,
            _ => new ConcurrentDictionary<string, CursorPosition> { [Context.ConnectionId] = cursor },
            (_, dict) => { dict[Context.ConnectionId] = cursor; return dict; });

        await Clients.OthersInGroup(documentId).SendAsync("CursorPosition", cursor);
    }

    public async Task SendTypingIndicator(string documentId, bool isTyping)
    {
        var userId = (_currentUser.UserId ?? Guid.Empty).ToString();
        await Clients.OthersInGroup(documentId).SendAsync("TypingIndicator", new
        {
            UserId = userId,
            ConnectionId = Context.ConnectionId,
            IsTyping = isTyping
        });
    }

    public async Task SendComment(string documentId, string commentId, string content, string userName)
    {
        await Clients.Group(documentId).SendAsync("NewComment", new
        {
            CommentId = commentId,
            Content = content,
            UserName = userName,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task SendReaction(string documentId, string commentId, string emoji, string userName)
    {
        await Clients.Group(documentId).SendAsync("NewReaction", new
        {
            CommentId = commentId,
            Emoji = emoji,
            UserName = userName
        });
    }

    public async Task SendSaved(string documentId, int version)
    {
        await Clients.Group(documentId).SendAsync("DocumentSaved", new
        {
            DocumentId = documentId,
            Version = version,
            SavedAt = DateTime.UtcNow
        });
    }

    private async Task BroadcastPresence(string documentId)
    {
        if (!_presence.ContainsKey(documentId)) return;
        var users = _presence[documentId].Values.ToList();
        await Clients.Group(documentId).SendAsync("PresenceUpdate", users);
    }

    private static string GetColorForUser(string userId)
    {
        var colors = new[]
        {
            "#6366F1", "#8B5CF6", "#06B6D4", "#10B981",
            "#F59E0B", "#F43F5E", "#EC4899", "#14B8A6"
        };
        var hash = userId.GetHashCode();
        return colors[Math.Abs(hash) % colors.Length];
    }
}

public class CursorPosition
{
    public string UserId { get; set; } = string.Empty;
    public int Position { get; set; }
    public int SelectionEnd { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366F1";
}

public class UserPresence
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public DateTime LastActive { get; set; }
}
