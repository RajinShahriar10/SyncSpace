using FluentAssertions;
using FluentValidation;
using MediatR;
using Moq;
using SyncSpace.Application.Common.Behaviours;

namespace SyncSpace.Application.UnitTests.Common;

public class ValidationBehaviorTests
{
    public record TestRequest : IRequest<string>;

    public class TestRequestValidator : AbstractValidator<TestRequest>
    {
    }

    public class FailingTestRequestValidator : AbstractValidator<TestRequest>
    {
        public FailingTestRequestValidator()
        {
            RuleFor(x => x).Custom((_, context) =>
                context.AddFailure("Custom validation failed"));
        }
    }

    [Fact]
    public async Task Handle_NoValidators_ShouldCallNext()
    {
        var validators = Enumerable.Empty<IValidator<TestRequest>>();
        var sut = new ValidationBehavior<TestRequest, string>(validators);

        var nextMock = new Mock<RequestHandlerDelegate<string>>();
        nextMock.Setup(x => x()).ReturnsAsync("response");

        var result = await sut.Handle(new TestRequest(), nextMock.Object, CancellationToken.None);

        result.Should().Be("response");
        nextMock.Verify(x => x(), Times.Once);
    }

    [Fact]
    public async Task Handle_WithValidatingValidators_ShouldCallNext()
    {
        var validators = new IValidator<TestRequest>[] { new TestRequestValidator() };
        var sut = new ValidationBehavior<TestRequest, string>(validators);

        var nextMock = new Mock<RequestHandlerDelegate<string>>();
        nextMock.Setup(x => x()).ReturnsAsync("response");

        var result = await sut.Handle(new TestRequest(), nextMock.Object, CancellationToken.None);

        result.Should().Be("response");
        nextMock.Verify(x => x(), Times.Once);
    }

    [Fact]
    public async Task Handle_WithFailingValidators_ShouldThrowValidationException()
    {
        var validators = new IValidator<TestRequest>[] { new FailingTestRequestValidator() };
        var sut = new ValidationBehavior<TestRequest, string>(validators);

        var nextMock = new Mock<RequestHandlerDelegate<string>>();

        var act = async () => await sut.Handle(new TestRequest(), nextMock.Object, CancellationToken.None);

        (await act.Should().ThrowAsync<ValidationException>())
            .And.Errors.Should().Contain(e => e.ErrorMessage == "Custom validation failed");

        nextMock.Verify(x => x(), Times.Never);
    }
}
