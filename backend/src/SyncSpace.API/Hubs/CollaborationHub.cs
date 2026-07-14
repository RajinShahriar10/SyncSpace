using Microsoft.AspNetCore.SignalR;

namespace SyncSpace.API.Hubs;

public class CollaborationHub : Hub
{
    public async Task JoinWorkspace(string workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace_{workspaceId}");
    }

    public async Task LeaveWorkspace(string workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace_{workspaceId}");
    }

    public async Task JoinDocument(string documentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"document_{documentId}");
        await Clients.OthersInGroup($"document_{documentId}")
            .SendAsync("UserJoined", Context.UserIdentifier);
    }

    public async Task LeaveDocument(string documentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"document_{documentId}");
        await Clients.OthersInGroup($"document_{documentId}")
            .SendAsync("UserLeft", Context.UserIdentifier);
    }

    public async Task SendDocumentUpdate(string documentId, object delta)
    {
        await Clients.OthersInGroup($"document_{documentId}")
            .SendAsync("ReceiveDocumentUpdate", Context.UserIdentifier, delta);
    }

    public async Task SendCursorPosition(string documentId, object position)
    {
        await Clients.OthersInGroup($"document_{documentId}")
            .SendAsync("ReceiveCursorPosition", Context.UserIdentifier, position);
    }

    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    public async Task LeaveChannel(string channelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    public async Task SendMessage(string channelId, string message)
    {
        await Clients.Group($"channel_{channelId}")
            .SendAsync("ReceiveMessage", Context.UserIdentifier, message);
    }

    public async Task SendTypingIndicator(string channelId)
    {
        await Clients.OthersInGroup($"channel_{channelId}")
            .SendAsync("UserTyping", Context.UserIdentifier);
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("Connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
