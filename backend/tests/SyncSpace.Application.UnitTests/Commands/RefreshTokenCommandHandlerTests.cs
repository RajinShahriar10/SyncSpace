using FluentAssertions;
using Moq;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.Commands;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;
using System.Security.Claims;

namespace SyncSpace.Application.UnitTests.Commands;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock = new(MockBehavior.Strict);
    private readonly RefreshTokenCommandHandler _sut;

    private readonly RefreshTokenCommand _validCommand = new()
    {
        AccessToken = "valid-access-token",
        RefreshToken = "valid-refresh-token"
    };

    private readonly Guid _userId = Guid.NewGuid();
    private readonly UserInfo _userInfo;
    private readonly AuthTokens _tokens;

    public RefreshTokenCommandHandlerTests()
    {
        _userInfo = new UserInfo
        {
            Id = _userId,
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            AvatarUrl = "https://example.com/avatar.jpg"
        };

        _tokens = new AuthTokens
        {
            AccessToken = "new-access-token",
            RefreshToken = "new-refresh-token",
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        _sut = new RefreshTokenCommandHandler(
            _identityServiceMock.Object,
            _jwtTokenServiceMock.Object,
            _refreshTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRefresh_ShouldReturnSuccess()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));

        _jwtTokenServiceMock
            .Setup(x => x.GetPrincipalFromExpiredToken(_validCommand.AccessToken))
            .Returns(principal);

        _identityServiceMock
            .Setup(x => x.GetUserInfoAsync(_userId))
            .ReturnsAsync(_userInfo);

        var storedToken = new RefreshToken
        {
            Token = _validCommand.RefreshToken,
            UserId = _userId,
            Expires = DateTime.UtcNow.AddDays(1),
            RevokedAt = null
        };

        _refreshTokenServiceMock
            .Setup(x => x.GetActiveTokenAsync(_validCommand.RefreshToken, _userId))
            .ReturnsAsync(storedToken);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(_userId))
            .ReturnsAsync(new List<string> { "Member" });

        _jwtTokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                _userId,
                _userInfo.Email,
                _userInfo.FirstName,
                _userInfo.LastName,
                It.IsAny<IList<string>>()))
            .ReturnsAsync(_tokens);

        _refreshTokenServiceMock
            .Setup(x => x.RevokeTokenAsync(storedToken, _tokens.RefreshToken))
            .Returns(Task.CompletedTask);

        _refreshTokenServiceMock
            .Setup(x => x.SaveTokenAsync(It.Is<RefreshToken>(rt =>
                rt.Token == _tokens.RefreshToken &&
                rt.UserId == _userId)))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be(_tokens.AccessToken);
        result.Data.RefreshToken.Should().Be(_tokens.RefreshToken);
        result.Data.User.Id.Should().Be(_userId);
        result.Data.User.Email.Should().Be(_userInfo.Email);

        _jwtTokenServiceMock.VerifyAll();
        _identityServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_InvalidAccessToken_ShouldReturnFailure()
    {
        _jwtTokenServiceMock
            .Setup(x => x.GetPrincipalFromExpiredToken(_validCommand.AccessToken))
            .Returns((ClaimsPrincipal?)null);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Invalid access token.");

        _jwtTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_InvalidRefreshToken_ShouldReturnFailure()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));

        _jwtTokenServiceMock
            .Setup(x => x.GetPrincipalFromExpiredToken(_validCommand.AccessToken))
            .Returns(principal);

        _identityServiceMock
            .Setup(x => x.GetUserInfoAsync(_userId))
            .ReturnsAsync(_userInfo);

        _refreshTokenServiceMock
            .Setup(x => x.GetActiveTokenAsync(_validCommand.RefreshToken, _userId))
            .ReturnsAsync((RefreshToken?)null);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Invalid refresh token.");

        _jwtTokenServiceMock.VerifyAll();
        _identityServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_ExpiredRefreshToken_ShouldReturnFailure()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, _userId.ToString())
        }));

        _jwtTokenServiceMock
            .Setup(x => x.GetPrincipalFromExpiredToken(_validCommand.AccessToken))
            .Returns(principal);

        _identityServiceMock
            .Setup(x => x.GetUserInfoAsync(_userId))
            .ReturnsAsync(_userInfo);

        var expiredToken = new RefreshToken
        {
            Token = _validCommand.RefreshToken,
            UserId = _userId,
            Expires = DateTime.UtcNow.AddDays(-1),
            RevokedAt = DateTime.UtcNow.AddDays(-1)
        };

        _refreshTokenServiceMock
            .Setup(x => x.GetActiveTokenAsync(_validCommand.RefreshToken, _userId))
            .ReturnsAsync(expiredToken);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Refresh token has expired or been revoked.");

        _jwtTokenServiceMock.VerifyAll();
        _identityServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }
}
