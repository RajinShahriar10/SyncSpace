using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ICurrentUserService _currentUser;

    public NotificationHub(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = _currentUser.UserId;
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"notifications:{userId.Value}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = _currentUser.UserId;
        if (userId.HasValue)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"notifications:{userId.Value}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task MarkNotificationRead(string notificationId)
    {
        await Clients.Caller.SendAsync("NotificationRead", new { NotificationId = notificationId });
    }
}
