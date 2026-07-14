using FluentAssertions;
using FluentValidation.TestHelper;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.UnitTests.Validators;

public class RefreshTokenCommandValidatorTests
{
    private readonly RefreshTokenCommandValidator _sut = new();

    [Fact]
    public void ValidCommand_ShouldNotHaveErrors()
    {
        var command = new RefreshTokenCommand
        {
            AccessToken = "valid-access-token",
            RefreshToken = "valid-refresh-token"
        };

        var result = _sut.TestValidate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyAccessToken_ShouldHaveError()
    {
        var command = new RefreshTokenCommand
        {
            AccessToken = string.Empty,
            RefreshToken = "valid-refresh-token"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.AccessToken)
            .WithErrorMessage("Access token is required");
    }

    [Fact]
    public void EmptyRefreshToken_ShouldHaveError()
    {
        var command = new RefreshTokenCommand
        {
            AccessToken = "valid-access-token",
            RefreshToken = string.Empty
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.RefreshToken)
            .WithErrorMessage("Refresh token is required");
    }
}
