using FluentAssertions;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.UnitTests.Enums;

public class EnumTests
{
    [Fact]
    public void WorkspaceRole_EnumValues()
    {
        ((int)WorkspaceRole.Owner).Should().Be(0);
        ((int)WorkspaceRole.Admin).Should().Be(1);
        ((int)WorkspaceRole.Editor).Should().Be(2);
        ((int)WorkspaceRole.Viewer).Should().Be(3);
    }

    [Fact]
    public void AuditAction_EnumValues()
    {
        ((int)AuditAction.UserLogin).Should().Be(0);
        ((int)AuditAction.UserLogout).Should().Be(1);
        ((int)AuditAction.UserRegister).Should().Be(2);
        ((int)AuditAction.TaskCreated).Should().Be(3);
        ((int)AuditAction.TaskUpdated).Should().Be(4);
        ((int)AuditAction.TaskDeleted).Should().Be(5);
        ((int)AuditAction.WorkspaceCreated).Should().Be(17);
        ((int)AuditAction.WorkspaceUpdated).Should().Be(18);
    }

    [Fact]
    public void CardPriority_EnumValues()
    {
        ((int)CardPriority.None).Should().Be(0);
        ((int)CardPriority.Low).Should().Be(1);
        ((int)CardPriority.Medium).Should().Be(2);
        ((int)CardPriority.High).Should().Be(3);
        ((int)CardPriority.Urgent).Should().Be(4);
    }

    [Fact]
    public void UserStatus_EnumValues()
    {
        ((int)UserStatus.Active).Should().Be(0);
        ((int)UserStatus.Inactive).Should().Be(1);
        ((int)UserStatus.Suspended).Should().Be(2);
    }

    [Fact]
    public void NotificationType_EnumValues()
    {
        ((int)NotificationType.Mention).Should().Be(0);
        ((int)NotificationType.Assignment).Should().Be(1);
        ((int)NotificationType.Comment).Should().Be(2);
        ((int)NotificationType.Update).Should().Be(3);
        ((int)NotificationType.Invite).Should().Be(4);
    }

    [Fact]
    public void ActivityType_EnumValues()
    {
        ((int)ActivityType.Created).Should().Be(0);
        ((int)ActivityType.Updated).Should().Be(1);
        ((int)ActivityType.Deleted).Should().Be(2);
        ((int)ActivityType.Moved).Should().Be(3);
        ((int)ActivityType.Assigned).Should().Be(4);
        ((int)ActivityType.CommentAdded).Should().Be(8);
        ((int)ActivityType.AttachmentAdded).Should().Be(11);
        ((int)ActivityType.AttachmentRemoved).Should().Be(12);
    }

    [Fact]
    public void MessageType_EnumValues()
    {
        ((int)MessageType.Text).Should().Be(0);
        ((int)MessageType.File).Should().Be(1);
        ((int)MessageType.System).Should().Be(2);
    }
}
