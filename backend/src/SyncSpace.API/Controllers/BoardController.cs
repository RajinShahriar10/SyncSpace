using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Boards.DTOs;
using SyncSpace.Application.Features.Boards.Commands;
using SyncSpace.Application.Features.Boards.Queries;
using SyncSpace.Domain.Enums;
using SyncSpace.API.Services;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BoardController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuditService _auditService;
    private readonly IContributionEngine _contributionEngine;

    public BoardController(IMediator mediator, IAuditService auditService, IContributionEngine contributionEngine)
    {
        _mediator = mediator;
        _auditService = auditService;
        _contributionEngine = contributionEngine;
    }

    // --- Board CRUD ---

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BoardDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateBoardCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BoardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _mediator.Send(new GetBoardQuery { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("workspace/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<BoardDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByWorkspace(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetWorkspaceBoardsQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }

    [HttpGet("{id:guid}/full")]
    [ProducesResponseType(typeof(ApiResponse<BoardWithCardsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFull(Guid id)
    {
        var result = await _mediator.Send(new GetBoardWithCardsQuery { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BoardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBoardCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteBoardCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Columns ---

    [HttpPost("columns")]
    [ProducesResponseType(typeof(ApiResponse<ColumnDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateColumn([FromBody] CreateColumnCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpPut("columns/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ColumnDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateColumn(Guid id, [FromBody] UpdateColumnCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("columns/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteColumn(Guid id)
    {
        var result = await _mediator.Send(new DeleteColumnCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("columns/reorder")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReorderColumns([FromBody] ReorderColumnsCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Cards ---

    [HttpPost("cards")]
    [ProducesResponseType(typeof(ApiResponse<CardDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCard([FromBody] CreateCardCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogAsync(
                userId, AuditAction.TaskCreated, "BoardCard", result.Data.Id, null,
                "Created task: " + result.Data.Title);
            await _contributionEngine.RecordActivityAsync(
                userId, ContributionActivity.TaskCreated, result.Data.Id.ToString());
        }
        return result.Success ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpPut("cards/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCard(Guid id, [FromBody] UpdateCardCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("cards/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCard(Guid id)
    {
        var result = await _mediator.Send(new DeleteCardCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("cards/move")]
    [ProducesResponseType(typeof(ApiResponse<CardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MoveCard([FromBody] MoveCardCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("cards/reorder")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReorderCards([FromBody] ReorderCardsCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("cards/assign")]
    [ProducesResponseType(typeof(ApiResponse<CardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignCard([FromBody] AssignCardCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Labels ---

    [HttpPost("labels")]
    [ProducesResponseType(typeof(ApiResponse<LabelDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateLabel([FromBody] CreateLabelCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpPost("cards/labels")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddLabelToCard([FromBody] AddLabelToCardCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("cards/labels")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveLabelFromCard([FromBody] RemoveLabelFromCardCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("labels/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteLabel(Guid id)
    {
        var result = await _mediator.Send(new DeleteLabelCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Comments ---

    [HttpPost("cards/comments")]
    [ProducesResponseType(typeof(ApiResponse<CardCommentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddCardComment([FromBody] AddCardCommentCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success && result.Data != null)
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _contributionEngine.RecordActivityAsync(
                userId, ContributionActivity.CommentAdded, result.Data.Id.ToString());
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("cards/comments/{commentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCardComment(Guid commentId)
    {
        var result = await _mediator.Send(new DeleteCardCommentCommand { CommentId = commentId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Attachments ---

    [HttpPost("cards/attachments")]
    [ProducesResponseType(typeof(ApiResponse<CardAttachmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddCardAttachment([FromBody] AddCardAttachmentCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("cards/attachments/{attachmentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCardAttachment(Guid attachmentId)
    {
        var result = await _mediator.Send(new DeleteCardAttachmentCommand { AttachmentId = attachmentId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Activity ---

    [HttpGet("{boardId:guid}/activity")]
    [ProducesResponseType(typeof(ApiResponse<List<ActivityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivity(Guid boardId, [FromQuery] int limit = 50)
    {
        var result = await _mediator.Send(new GetBoardActivityQuery { BoardId = boardId, Limit = limit });
        return Ok(result);
    }

    // --- Members ---

    [HttpGet("workspace/{workspaceId:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<List<BoardMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMembers(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetWorkspaceMembersQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }
}
