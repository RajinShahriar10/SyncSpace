using System.Net;
using FluentAssertions;
using SyncSpace.Application.Common.Models;

namespace SyncSpace.Application.UnitTests.Common;

public class ApiResponseTests
{
    [Fact]
    public void SuccessResponse_ShouldHaveSuccessTrue()
    {
        var result = ApiResponse<string>.SuccessResponse("data");

        result.Success.Should().BeTrue();
        result.Data.Should().Be("data");
        result.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public void SuccessResponse_WithMessage_ShouldSetMessage()
    {
        var result = ApiResponse<string>.SuccessResponse("data", "Operation successful");

        result.Success.Should().BeTrue();
        result.Data.Should().Be("data");
        result.Message.Should().Be("Operation successful");
    }

    [Fact]
    public void Failure_ShouldHaveSuccessFalse()
    {
        var result = ApiResponse<string>.Failure("Something went wrong");

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Something went wrong");
        result.Errors.Should().Contain("Something went wrong");
        result.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public void Failure_WithStatusCode_ShouldSetStatusCode()
    {
        var result = ApiResponse<string>.Failure("Unauthorized", HttpStatusCode.Unauthorized);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Unauthorized");
        result.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public void NotFound_ShouldReturn404()
    {
        var result = ApiResponse<string>.NotFound("User not found");

        result.Success.Should().BeFalse();
        result.Message.Should().Be("User not found");
        result.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public void NotFound_WithDefaultMessage_ShouldReturn404()
    {
        var result = ApiResponse<string>.NotFound();

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Resource not found");
        result.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public void PaginatedResult_ShouldCalculateTotalPages()
    {
        var result = new PaginatedResult<string>
        {
            Items = new[] { "a", "b", "c", "d", "e" },
            TotalCount = 25,
            PageNumber = 1,
            PageSize = 10
        };

        result.TotalPages.Should().Be(3);
    }

    [Fact]
    public void PaginatedResult_ShouldCalculateHasNextPage()
    {
        var result = new PaginatedResult<string>
        {
            Items = new[] { "a", "b", "c" },
            TotalCount = 25,
            PageNumber = 1,
            PageSize = 10
        };

        result.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public void PaginatedResult_ShouldCalculateHasPreviousPage()
    {
        var result = new PaginatedResult<string>
        {
            Items = new[] { "a", "b", "c" },
            TotalCount = 25,
            PageNumber = 2,
            PageSize = 10
        };

        result.HasPreviousPage.Should().BeTrue();
    }

    [Fact]
    public void PaginatedResult_FirstPage_ShouldNotHavePreviousPage()
    {
        var result = new PaginatedResult<string>
        {
            Items = new[] { "a", "b", "c" },
            TotalCount = 25,
            PageNumber = 1,
            PageSize = 10
        };

        result.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public void PaginatedResult_LastPage_ShouldNotHaveNextPage()
    {
        var result = new PaginatedResult<string>
        {
            Items = new[] { "a", "b", "c" },
            TotalCount = 25,
            PageNumber = 3,
            PageSize = 10
        };

        result.HasNextPage.Should().BeFalse();
    }
}
