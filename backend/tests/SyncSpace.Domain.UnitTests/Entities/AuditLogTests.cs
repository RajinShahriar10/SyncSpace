using FluentAssertions;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.UnitTests.Entities;

public class AuditLogTests
{
    [Fact]
    public void AuditLog_ShouldSetAllProperties()
    {
        var userId = Guid.NewGuid();
        var entityId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        var log = new AuditLog
        {
            UserId = userId,
            Action = AuditAction.UserLogin,
            EntityType = "User",
            EntityId = entityId,
            WorkspaceId = workspaceId,
            Description = "User logged in",
            OldValue = null,
            NewValue = "active",
            IpAddress = "192.168.1.1",
            UserAgent = "Mozilla/5.0"
        };

        log.UserId.Should().Be(userId);
        log.Action.Should().Be(AuditAction.UserLogin);
        log.EntityType.Should().Be("User");
        log.EntityId.Should().Be(entityId);
        log.WorkspaceId.Should().Be(workspaceId);
        log.Description.Should().Be("User logged in");
        log.OldValue.Should().BeNull();
        log.NewValue.Should().Be("active");
        log.IpAddress.Should().Be("192.168.1.1");
        log.UserAgent.Should().Be("Mozilla/5.0");
    }

    [Fact]
    public void AuditLog_ShouldDefaultEntityType()
    {
        var log = new AuditLog();

        log.EntityType.Should().BeEmpty();
        log.Description.Should().BeEmpty();
        log.Action.Should().Be(default(AuditAction));
    }
}
