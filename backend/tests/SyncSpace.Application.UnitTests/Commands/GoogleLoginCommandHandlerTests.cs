using FluentAssertions;
using Moq;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.Commands;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.UnitTests.Commands;

public class GoogleLoginCommandHandlerTests
{
    private readonly Mock<IGoogleAuthService> _googleAuthServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IIdentityService> _identityServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock = new(MockBehavior.Strict);
    private readonly GoogleLoginCommandHandler _sut;

    private readonly GoogleLoginCommand _validCommand = new()
    {
        IdToken = "valid-google-token"
    };

    private readonly ExternalUserInfo _googleUser = new()
    {
        Email = "googleuser@gmail.com",
        FirstName = "Google",
        LastName = "User",
        Picture = "https://example.com/pic.jpg"
    };

    private readonly UserInfo _existingUser;
    private readonly Guid _existingUserId = Guid.NewGuid();
    private readonly AuthTokens _tokens;

    public GoogleLoginCommandHandlerTests()
    {
        _existingUser = new UserInfo
        {
            Id = _existingUserId,
            Email = _googleUser.Email,
            FirstName = _googleUser.FirstName,
            LastName = _googleUser.LastName,
            AvatarUrl = _googleUser.Picture
        };

        _tokens = new AuthTokens
        {
            AccessToken = "access-token",
            RefreshToken = "refresh-token",
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        _sut = new GoogleLoginCommandHandler(
            _googleAuthServiceMock.Object,
            _identityServiceMock.Object,
            _jwtTokenServiceMock.Object,
            _refreshTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidGoogleToken_ExistingUser_ShouldReturnSuccess()
    {
        _googleAuthServiceMock
            .Setup(x => x.ValidateTokenAsync(_validCommand.IdToken))
            .ReturnsAsync(_googleUser);

        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_googleUser.Email))
            .ReturnsAsync(_existingUser);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(_existingUserId))
            .ReturnsAsync(new List<string> { "Member" });

        _jwtTokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                _existingUserId,
                _existingUser.Email,
                _existingUser.FirstName,
                _existingUser.LastName,
                It.IsAny<IList<string>>()))
            .ReturnsAsync(_tokens);

        _refreshTokenServiceMock
            .Setup(x => x.SaveTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Message.Should().Be("Google login successful");
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be(_tokens.AccessToken);
        result.Data.RefreshToken.Should().Be(_tokens.RefreshToken);
        result.Data.User.Id.Should().Be(_existingUserId);
        result.Data.User.Email.Should().Be(_existingUser.Email);

        _googleAuthServiceMock.VerifyAll();
        _identityServiceMock.VerifyAll();
        _jwtTokenServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_ValidGoogleToken_NewUser_ShouldCreateAndReturnSuccess()
    {
        _googleAuthServiceMock
            .Setup(x => x.ValidateTokenAsync(_validCommand.IdToken))
            .ReturnsAsync(_googleUser);

        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(_googleUser.Email))
            .ReturnsAsync((UserInfo?)null);

        _identityServiceMock
            .Setup(x => x.CreateUserWithoutPasswordAsync(
                It.IsAny<Guid>(),
                _googleUser.Email,
                _googleUser.FirstName,
                _googleUser.LastName,
                _googleUser.Picture))
            .ReturnsAsync((true, Array.Empty<string>()));

        _identityServiceMock
            .Setup(x => x.AddToRoleAsync(It.IsAny<Guid>(), "Member"))
            .ReturnsAsync((true, Array.Empty<string>()));

        _identityServiceMock
            .Setup(x => x.GetUserInfoAsync(It.IsAny<Guid>()))
            .ReturnsAsync(_existingUser);

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(_existingUserId))
            .ReturnsAsync(new List<string> { "Member" });

        _jwtTokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                _existingUserId,
                _existingUser.Email,
                _existingUser.FirstName,
                _existingUser.LastName,
                It.IsAny<IList<string>>()))
            .ReturnsAsync(_tokens);

        _refreshTokenServiceMock
            .Setup(x => x.SaveTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Message.Should().Be("Google login successful");
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be(_tokens.AccessToken);
        result.Data.User.Email.Should().Be(_existingUser.Email);

        _googleAuthServiceMock.VerifyAll();
        _identityServiceMock.VerifyAll();
        _jwtTokenServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_InvalidGoogleToken_ShouldReturnFailure()
    {
        _googleAuthServiceMock
            .Setup(x => x.ValidateTokenAsync(_validCommand.IdToken))
            .ReturnsAsync((ExternalUserInfo?)null);

        var result = await _sut.Handle(_validCommand, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Invalid Google token.");

        _googleAuthServiceMock.VerifyAll();
    }
}
