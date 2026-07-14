using FluentAssertions;
using FluentValidation.TestHelper;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.UnitTests.Validators;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _sut = new();

    [Fact]
    public void ValidCommand_ShouldNotHaveErrors()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyEmail_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = string.Empty,
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Email is required");
    }

    [Fact]
    public void InvalidEmail_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "not-an-email",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("Please enter a valid email address");
    }

    [Fact]
    public void TooLongEmail_ShouldHaveError()
    {
        var localPart = new string('a', 200);
        var command = new RegisterCommand
        {
            Email = localPart + "@" + new string('b', 55) + ".com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void EmptyPassword_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = string.Empty,
            ConfirmPassword = string.Empty,
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password is required");
    }

    [Fact]
    public void ShortPassword_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Ab1!",
            ConfirmPassword = "Ab1!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must be at least 8 characters");
    }

    [Fact]
    public void PasswordWithoutUppercase_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "password123!",
            ConfirmPassword = "password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one uppercase letter");
    }

    [Fact]
    public void PasswordWithoutLowercase_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "PASSWORD123!",
            ConfirmPassword = "PASSWORD123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one lowercase letter");
    }

    [Fact]
    public void PasswordWithoutDigit_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password!!!",
            ConfirmPassword = "Password!!!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one number");
    }

    [Fact]
    public void PasswordWithoutSpecialChar_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123",
            ConfirmPassword = "Password123",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one special character");
    }

    [Fact]
    public void EmptyConfirmPassword_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = string.Empty,
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword)
            .WithErrorMessage("Please confirm your password");
    }

    [Fact]
    public void MismatchedConfirmPassword_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPass1!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ConfirmPassword)
            .WithErrorMessage("Passwords do not match");
    }

    [Fact]
    public void EmptyFirstName_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = string.Empty,
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name is required");
    }

    [Fact]
    public void FirstNameWithNumbers_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John123",
            LastName = "Doe"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.FirstName)
            .WithErrorMessage("First name can only contain letters, spaces, hyphens, and apostrophes");
    }

    [Fact]
    public void EmptyLastName_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = string.Empty
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name is required");
    }

    [Fact]
    public void LastNameWithNumbers_ShouldHaveError()
    {
        var command = new RegisterCommand
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe123"
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.LastName)
            .WithErrorMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");
    }
}
