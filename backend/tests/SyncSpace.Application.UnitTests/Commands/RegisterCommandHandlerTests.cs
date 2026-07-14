using FluentAssertions;
using Moq;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Auth.Commands;
using SyncSpace.Application.Features.Auth.DTOs;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.UnitTests.Commands;

public class RegisterCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock = new(MockBehavior.Strict);
    private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock = new(MockBehavior.Strict);
    private readonly RegisterCommandHandler _sut;

    public RegisterCommandHandlerTests()
    {
        _sut = new RegisterCommandHandler(
            _identityServiceMock.Object,
            _jwtTokenServiceMock.Object,
            _refreshTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRegistration_ShouldReturnSuccess()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(command.Email))
            .ReturnsAsync((UserInfo?)null);

        _identityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<Guid>(),
                command.Email,
                command.Password,
                command.FirstName,
                command.LastName))
            .ReturnsAsync((true, Array.Empty<string>()));

        _identityServiceMock
            .Setup(x => x.AddToRoleAsync(It.IsAny<Guid>(), "Member"))
            .ReturnsAsync((true, Array.Empty<string>()));

        _identityServiceMock
            .Setup(x => x.GetRolesAsync(It.IsAny<Guid>()))
            .ReturnsAsync(new List<string> { "Member" });

        var tokens = new AuthTokens
        {
            AccessToken = "access-token",
            RefreshToken = "refresh-token",
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        _jwtTokenServiceMock
            .Setup(x => x.GenerateTokensAsync(
                It.IsAny<Guid>(),
                command.Email,
                command.FirstName,
                command.LastName,
                It.IsAny<IList<string>>()))
            .ReturnsAsync(tokens);

        _refreshTokenServiceMock
            .Setup(x => x.SaveTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Handle(command, CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Message.Should().Be("Registration successful");
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().Be("access-token");
        result.Data.RefreshToken.Should().Be("refresh-token");
        result.Data.User.Email.Should().Be(command.Email);
        result.Data.User.FirstName.Should().Be(command.FirstName);
        result.Data.User.LastName.Should().Be(command.LastName);

        _identityServiceMock.VerifyAll();
        _jwtTokenServiceMock.VerifyAll();
        _refreshTokenServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ShouldReturnFailure()
    {
        var command = new RegisterCommand
        {
            Email = "existing@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(command.Email))
            .ReturnsAsync(new UserInfo
            {
                Id = Guid.NewGuid(),
                Email = command.Email,
                FirstName = "Existing",
                LastName = "User"
            });

        var result = await _sut.Handle(command, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("An account with this email already exists.");

        _identityServiceMock.VerifyAll();
    }

    [Fact]
    public async Task Handle_IdentityServiceFailure_ShouldReturnFailure()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        _identityServiceMock
            .Setup(x => x.GetUserInfoByEmailAsync(command.Email))
            .ReturnsAsync((UserInfo?)null);

        _identityServiceMock
            .Setup(x => x.CreateUserAsync(
                It.IsAny<Guid>(),
                command.Email,
                command.Password,
                command.FirstName,
                command.LastName))
            .ReturnsAsync((false, new[] { "User creation failed" }));

        var result = await _sut.Handle(command, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("User creation failed");
        result.Errors.Should().Contain("User creation failed");

        _identityServiceMock.VerifyAll();
    }
}
