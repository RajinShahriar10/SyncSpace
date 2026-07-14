using FluentAssertions;
using SyncSpace.Domain.Common;

namespace SyncSpace.Domain.UnitTests.Entities;

public class TestEntity : BaseEntity { }
public class TestAuditableEntity : AuditableEntity { }

public class BaseEntityTests
{
    [Fact]
    public void BaseEntity_ShouldHaveDefaultValues()
    {
        var entity = new TestEntity();

        entity.Id.Should().Be(Guid.Empty);
        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        entity.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        entity.CreatedBy.Should().BeNull();
        entity.UpdatedBy.Should().BeNull();
    }

    [Fact]
    public void BaseEntity_ShouldSetProperties()
    {
        var id = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var entity = new TestEntity
        {
            Id = id,
            CreatedAt = now,
            UpdatedAt = now.AddHours(1),
            CreatedBy = "user1",
            UpdatedBy = "user2"
        };

        entity.Id.Should().Be(id);
        entity.CreatedAt.Should().Be(now);
        entity.UpdatedAt.Should().Be(now.AddHours(1));
        entity.CreatedBy.Should().Be("user1");
        entity.UpdatedBy.Should().Be("user2");
    }

    [Fact]
    public void AuditableEntity_ShouldInheritFromBaseEntity()
    {
        var entity = new TestAuditableEntity();

        entity.Should().BeAssignableTo<BaseEntity>();
        entity.Id.Should().Be(Guid.Empty);
        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void AuditableEntity_ShouldHaveSoftDeleteProperties()
    {
        var entity = new TestAuditableEntity();

        entity.IsDeleted.Should().BeFalse();
        entity.DeletedAt.Should().BeNull();
        entity.DeletedBy.Should().BeNull();
    }

    [Fact]
    public void AuditableEntity_ShouldSetSoftDeleteProperties()
    {
        var now = DateTime.UtcNow;
        var entity = new TestAuditableEntity
        {
            IsDeleted = true,
            DeletedAt = now,
            DeletedBy = "admin"
        };

        entity.IsDeleted.Should().BeTrue();
        entity.DeletedAt.Should().Be(now);
        entity.DeletedBy.Should().Be("admin");
    }
}
