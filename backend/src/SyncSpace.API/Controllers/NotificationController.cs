using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Notifications.DTOs;
using SyncSpace.Application.Features.Notifications.Commands;
using SyncSpace.Application.Features.Notifications.Queries;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] Guid userId,
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var result = await _mediator.Send(new GetUserNotificationsQuery
        {
            UserId = userId,
            UnreadOnly = unreadOnly,
            Page = page,
            PageSize = pageSize
        });
        return Ok(result);
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<NotificationSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] Guid userId)
    {
        var result = await _mediator.Send(new GetNotificationSummaryQuery { UserId = userId });
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success
            ? CreatedAtAction(nameof(GetNotifications), new { userId = result.Data!.UserId }, result)
            : BadRequest(result);
    }

    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var result = await _mediator.Send(new MarkAsReadCommand { NotificationId = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("read-all")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] Guid userId)
    {
        var result = await _mediator.Send(new MarkAllAsReadCommand { UserId = userId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteNotificationCommand { NotificationId = id });
        return result.Success ? Ok(result) : NotFound(result);
    }
}
