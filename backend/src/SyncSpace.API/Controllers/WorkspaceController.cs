using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Workspace.DTOs;
using SyncSpace.Application.Features.Workspace.Commands;
using SyncSpace.Application.Features.Workspace.Queries;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspaceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuditService _auditService;

    public WorkspaceController(IMediator mediator, IAuditService auditService)
    {
        _mediator = mediator;
        _auditService = auditService;
    }

    // --- CRUD ---

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateWorkspaceCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success
            ? CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _mediator.Send(new GetWorkspaceQuery { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<WorkspaceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserWorkspaces()
    {
        var result = await _mediator.Send(new GetUserWorkspacesQuery());
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkspaceCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteWorkspaceCommand { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Members ---

    [HttpGet("{workspaceId:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<List<WorkspaceMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMembers(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetWorkspaceMembersQuery { WorkspaceId = workspaceId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("{workspaceId:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceMemberDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> InviteMember(Guid workspaceId, [FromBody] InviteMemberCommand command)
    {
        var result = await _mediator.Send(command with { WorkspaceId = workspaceId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{workspaceId:guid}/members/{userId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveMember(Guid workspaceId, Guid userId)
    {
        var result = await _mediator.Send(new RemoveMemberCommand
        {
            WorkspaceId = workspaceId,
            UserId = userId
        });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{workspaceId:guid}/members/{userId:guid}/role")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceMemberDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMemberRole(Guid workspaceId, Guid userId, [FromBody] UpdateMemberRoleCommand command)
    {
        var result = await _mediator.Send(command with
        {
            WorkspaceId = workspaceId,
            UserId = userId
        });
        if (result.Success && result.Data != null)
        {
            var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogAsync(
                currentUserId, AuditAction.RoleChanged, "WorkspaceMember", userId, workspaceId,
                "Changed role for member " + userId + " to " + command.Role,
                newValue: command.Role.ToString());
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
