using FluentAssertions;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Domain.UnitTests.Entities;

public class RefreshTokenTests
{
    [Fact]
    public void RefreshToken_ShouldHaveDefaultValues()
    {
        var token = new RefreshToken();

        token.Token.Should().BeEmpty();
        token.UserId.Should().Be(Guid.Empty);
        token.Expires.Should().Be(default(DateTime));
        token.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        token.CreatedByIp.Should().BeNull();
        token.RevokedAt.Should().BeNull();
        token.RevokedByIp.Should().BeNull();
        token.ReplacedByToken.Should().BeNull();
        token.User.Should().BeNull();
    }

    [Fact]
    public void RefreshToken_IsActive_WhenNotRevokedAndNotExpired()
    {
        var token = new RefreshToken
        {
            Expires = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };

        token.IsActive.Should().BeTrue();
    }

    [Fact]
    public void RefreshToken_IsActive_WhenRevoked()
    {
        var token = new RefreshToken
        {
            Expires = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow
        };

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void RefreshToken_IsActive_WhenExpired()
    {
        var token = new RefreshToken
        {
            Expires = DateTime.UtcNow.AddDays(-1),
            RevokedAt = null
        };

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void RefreshToken_IsExpired_WhenPastExpiry()
    {
        var token = new RefreshToken
        {
            Expires = DateTime.UtcNow.AddHours(-1)
        };

        token.IsExpired.Should().BeTrue();
    }

    [Fact]
    public void RefreshToken_IsExpired_WhenFutureDate()
    {
        var token = new RefreshToken
        {
            Expires = DateTime.UtcNow.AddDays(7)
        };

        token.IsExpired.Should().BeFalse();
    }

    [Fact]
    public void RefreshToken_ShouldSetTokenProperty()
    {
        var token = new RefreshToken
        {
            Token = "abc123"
        };

        token.Token.Should().Be("abc123");
    }

    [Fact]
    public void RefreshToken_ShouldSetUserIdProperty()
    {
        var userId = Guid.NewGuid();
        var token = new RefreshToken
        {
            UserId = userId
        };

        token.UserId.Should().Be(userId);
    }
}
