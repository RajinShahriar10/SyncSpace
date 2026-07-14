using FluentAssertions;
using FluentValidation.TestHelper;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.UnitTests.Validators;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _sut = new();

    [Fact]
    public void ValidCommand_ShouldNotHaveErrors()
    {
        var command = new LoginCommand
        {
            Email = "test@example.com",
            Password = "Password123!"
        };

        var result = _sut.TestValidate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyEmail_ShouldHaveError()
    {
        var command = new LoginCommand
        {
            Email = string.Empty,
            Password = "Password123!"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email is required");
    }

    [Fact]
    public void InvalidEmail_ShouldHaveError()
    {
        var command = new LoginCommand
        {
            Email = "not-an-email",
            Password = "Password123!"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Please enter a valid email address");
    }

    [Fact]
    public void EmptyPassword_ShouldHaveError()
    {
        var command = new LoginCommand
        {
            Email = "test@example.com",
            Password = string.Empty
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password is required");
    }
}
