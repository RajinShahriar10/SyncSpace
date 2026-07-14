using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Documents.DTOs;
using SyncSpace.Application.Features.Documents.Commands;
using SyncSpace.Application.Features.Documents.Queries;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuditService _auditService;

    public DocumentController(IMediator mediator, IAuditService auditService)
    {
        _mediator = mediator;
        _auditService = auditService;
    }

    // --- CRUD ---

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DocumentDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateDocumentCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _mediator.Send(new GetDocumentQuery { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("workspace/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<DocumentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByWorkspace(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetWorkspaceDocumentsQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        if (result.Success && result.Data != null)
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogAsync(
                userId, AuditAction.DocumentEdited, "Document", id, result.Data.WorkspaceId,
                "Edited document: " + result.Data.Title);
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteDocumentCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Versions ---

    [HttpGet("{documentId:guid}/versions")]
    [ProducesResponseType(typeof(ApiResponse<List<DocumentVersionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVersions(Guid documentId)
    {
        var result = await _mediator.Send(new GetDocumentVersionsQuery { DocumentId = documentId });
        return Ok(result);
    }

    [HttpPost("{documentId:guid}/versions/{versionNumber:int}/restore")]
    [ProducesResponseType(typeof(ApiResponse<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RestoreVersion(Guid documentId, int versionNumber)
    {
        var result = await _mediator.Send(new RestoreVersionCommand
        {
            DocumentId = documentId,
            VersionNumber = versionNumber
        });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Comments ---

    [HttpGet("{documentId:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<List<CommentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(Guid documentId)
    {
        var result = await _mediator.Send(new GetDocumentCommentsQuery { DocumentId = documentId });
        return Ok(result);
    }

    [HttpPost("{documentId:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<CommentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddComment(Guid documentId, [FromBody] AddCommentCommand command)
    {
        var result = await _mediator.Send(command with { DocumentId = documentId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("comments/{commentId:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolveComment(Guid commentId, [FromBody] ResolveCommentCommand command)
    {
        var result = await _mediator.Send(command with { CommentId = commentId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("comments/{commentId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<ReactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddReaction(Guid commentId, [FromBody] AddReactionCommand command)
    {
        var result = await _mediator.Send(command with { CommentId = commentId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("comments/{commentId:guid}/reactions/{emoji}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveReaction(Guid commentId, string emoji)
    {
        var result = await _mediator.Send(new RemoveReactionCommand { CommentId = commentId, Emoji = emoji });
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
