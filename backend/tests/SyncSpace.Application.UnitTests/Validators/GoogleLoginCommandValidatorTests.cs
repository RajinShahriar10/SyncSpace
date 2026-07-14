using FluentAssertions;
using FluentValidation.TestHelper;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.UnitTests.Validators;

public class GoogleLoginCommandValidatorTests
{
    private readonly GoogleLoginCommandValidator _sut = new();

    [Fact]
    public void ValidCommand_ShouldNotHaveErrors()
    {
        var command = new GoogleLoginCommand
        {
            IdToken = "valid-google-id-token"
        };

        var result = _sut.TestValidate(command);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyIdToken_ShouldHaveError()
    {
        var command = new GoogleLoginCommand
        {
            IdToken = string.Empty
        };

        var result = _sut.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.IdToken)
            .WithErrorMessage("Google ID token is required");
    }
}
