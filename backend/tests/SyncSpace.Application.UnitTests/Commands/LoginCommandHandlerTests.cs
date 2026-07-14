using FluentAssertions;
using Moq;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.Commands;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.UnitTests.Commands;

public class LoginCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock = new(MockBehavior.Strict);
    private readonly LoginCommandHandler _sut;

    private readonly LoginCommand _validCommand = new()
    {
        Email = "test@example.com",
        Password = "Password123!"
    };

    private readonly UserInfo _userInfo = new()
    {
        Id = Guid.NewGuid(),
        Email = "test@example.com",
        FirstName = "John",
        LastName = "Doe",
        AvatarUrl = "https://example.com/avatar.jpg"
    };

    public LoginCommandHandlerTests()
    {
        _sut = new LoginCommandHandler(
            _identityServiceMock.Object,
            _jwtTokenServiceMock.Object,
            _refreshTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidLogin_ShouldReturnSuccess()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync(_userInfo);

        _identityServiceMock
            .Setup(x => x.GetLockoutEndAsync(_userInfo.Id))
            .ReturnsAsync((DateTime?)null);

        _identityServiceMock
            .Setup(x => x.IsUserActiveAsync(_userInfo.Id))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(_validCommand.Email, _validCommand.Password))
            .ReturnsAsync((true, string.Empty));

        _identityServiceMock
            .Setup(x => x.GetFailedLoginAttemptsAsync(_userInfo.Id))
            .ReturnsAsync(0);

        _identityServiceMock
            .Setup(x => x.SetLastLoginAsync(_userInfo.Id))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(_userInfo.Id))
            .ReturnsAsync(new List<string> { "Member" });

        var tokens = new AuthTokens
        {
            AccessToken = "access-token",
            RefreshToken = "refresh-token",
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        _jwtTokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                _userInfo.Id,
                _userInfo.Email,
                _userInfo.FirstName,
                _userInfo.LastName,
                It.IsAny<IList<string>>()))
            .ReturnsAsync(tokens);

        _refreshTokenServiceMock
            .Setup(x => x.SaveTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Message.Should().Be("Login successful");
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("access-token");
        result.Data.RefreshToken.Should().Be("refresh-token");
        result.Data.User.Id.Should().Be(_userInfo.Id);
        result.Data.User.Email.Should().Be(_userInfo.Email);
        result.Data.User.FirstName.Should().Be(_userInfo.FirstName);
        result.Data.User.LastName.Should().Be(_userInfo.LastName);
        result.Data.User.AvatarUrl.Should().Be(_userInfo.AvatarUrl);

        _identityServiceMock.VerifyAll();
        _jwtTokenServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_InvalidEmail_ShouldReturnFailure()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync((UserInfo?)null);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Invalid email or password.");

        _identityServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_InvalidPassword_ShouldReturnFailure()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync(_userInfo);

        _identityServiceMock
            .Setup(x => x.GetLockoutEndAsync(_userInfo.Id))
            .ReturnsAsync((DateTime?)null);

        _identityServiceMock
            .Setup(x => x.IsUserActiveAsync(_userInfo.Id))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(_validCommand.Email, _validCommand.Password))
            .ReturnsAsync((false, "Invalid password"));

        _identityServiceMock
            .Setup(x => x.GetFailedLoginAttemptsAsync(_userInfo.Id))
            .ReturnsAsync(1);

        _identityServiceMock
            .Setup(x => x.IncrementFailedAttemptsAsync(_userInfo.Id))
            .ReturnsAsync(true);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Invalid email or password.");

        _identityServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_LockedAccount_ShouldReturnFailure()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync(_userInfo);

        _identityServiceMock
            .Setup(x => x.GetLockoutEndAsync(_userInfo.Id))
            .ReturnsAsync(DateTime.UtcNow.AddMinutes(30));

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Account is locked. Please try again later.");

        _identityServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_DeactivatedAccount_ShouldReturnFailure()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync(_userInfo);

        _identityServiceMock
            .Setup(x => x.GetLockoutEndAsync(_userInfo.Id))
            .ReturnsAsync((DateTime?)null);

        _identityServiceMock
            .Setup(x => x.IsUserActiveAsync(_userInfo.Id))
            .ReturnsAsync(false);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Account has been deactivated. Please contact support.");

        _identityServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_FailedAttempts_ShouldLockAfterFiveAttempts()
    {
        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_validCommand.Email))
            .ReturnsAsync(_userInfo);

        _identityServiceMock
            .Setup(x => x.GetLockoutEndAsync(_userInfo.Id))
            .ReturnsAsync((DateTime?)null);

        _identityServiceMock
            .Setup(x => x.IsUserActiveAsync(_userInfo.Id))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.CheckPasswordAsync(_validCommand.Email, _validCommand.Password))
            .ReturnsAsync((false, "Invalid password"));

        _identityServiceMock
            .Setup(x => x.GetFailedLoginAttemptsAsync(_userInfo.Id))
            .ReturnsAsync(4);

        _identityServiceMock
            .Setup(x => x.LockoutUserAsync(_userInfo.Id, TimeSpan.FromMinutes(30)))
            .ReturnsAsync(true);

        _identityServiceMock
            .Setup(x => x.ResetFailedAttemptsAsync(_userInfo.Id))
            .ReturnsAsync(true);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Account locked due to too many failed attempts. Try again in 30 minutes.");

        _identityServiceMock.VerifyAll();
    }
}
