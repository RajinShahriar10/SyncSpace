using FluentAssertions;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.UnitTests.Entities;

public class UserTests
{
    [Fact]
    public void User_ShouldHaveDefaultValues()
    {
        var user = new User();

        user.Status.Should().Be(UserStatus.Active);
        user.IdentityId.Should().BeEmpty();
        user.Email.Should().BeEmpty();
        user.FirstName.Should().BeEmpty();
        user.LastName.Should().BeEmpty();
        user.AvatarUrl.Should().BeNull();
        user.Bio.Should().BeNull();
    }

    [Fact]
    public void User_FullName_ShouldCombineNames()
    {
        var user = new User
        {
            FirstName = "John",
            LastName = "Doe"
        };

        user.FullName.Should().Be("John Doe");
    }

    [Fact]
    public void User_ShouldSetAllProperties()
    {
        var id = Guid.NewGuid();
        var user = new User
        {
            Id = id,
            IdentityId = "identity-123",
            Email = "john@example.com",
            FirstName = "John",
            LastName = "Doe",
            AvatarUrl = "https://example.com/avatar.png",
            Bio = "A developer",
            Status = UserStatus.Inactive
        };

        user.Id.Should().Be(id);
        user.IdentityId.Should().Be("identity-123");
        user.Email.Should().Be("john@example.com");
        user.FirstName.Should().Be("John");
        user.LastName.Should().Be("Doe");
        user.AvatarUrl.Should().Be("https://example.com/avatar.png");
        user.Bio.Should().Be("A developer");
        user.Status.Should().Be(UserStatus.Inactive);
    }

    [Fact]
    public void User_Collections_ShouldInitializeEmpty()
    {
        var user = new User();

        user.WorkspaceMembers.Should().BeEmpty();
        user.Documents.Should().BeEmpty();
        user.Messages.Should().BeEmpty();
        user.Notifications.Should().BeEmpty();
    }
}
