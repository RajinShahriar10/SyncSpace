using FluentAssertions;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.UnitTests.Entities;

public class NotificationTests
{
    [Fact]
    public void Notification_ShouldDefaultIsReadToFalse()
    {
        var notification = new Notification();

        notification.IsRead.Should().BeFalse();
        notification.Type.Should().Be(default(NotificationType));
        notification.Title.Should().BeEmpty();
        notification.Message.Should().BeEmpty();
        notification.UserId.Should().Be(Guid.Empty);
        notification.ActionUrl.Should().BeNull();
    }

    [Fact]
    public void Notification_ShouldSetAllProperties()
    {
        var userId = Guid.NewGuid();
        var notification = new Notification
        {
            Type = NotificationType.Mention,
            Title = "You were mentioned",
            Message = "Someone mentioned you in a comment",
            UserId = userId,
            IsRead = true,
            ActionUrl = "https://example.com/post/1"
        };

        notification.Type.Should().Be(NotificationType.Mention);
        notification.Title.Should().Be("You were mentioned");
        notification.Message.Should().Be("Someone mentioned you in a comment");
        notification.UserId.Should().Be(userId);
        notification.IsRead.Should().BeTrue();
        notification.ActionUrl.Should().Be("https://example.com/post/1");
    }
}
