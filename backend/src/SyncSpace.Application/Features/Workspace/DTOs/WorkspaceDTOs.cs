using MediatR;
using SyncSpace.Application.Common.Models;

namespace SyncSpace.Application.Features.Workspace.DTOs;

// --- Commands ---

public record CreateWorkspaceCommand : IRequest<ApiResponse<WorkspaceDto>>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Slug { get; init; }
}

public record UpdateWorkspaceCommand : IRequest<ApiResponse<WorkspaceDto>>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? Slug { get; init; }
    public string? IconUrl { get; init; }
}

public record DeleteWorkspaceCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

public record InviteMemberCommand : IRequest<ApiResponse<WorkspaceMemberDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = "Editor";
}

public record RemoveMemberCommand : IRequest<ApiResponse<bool>>
{
    public Guid WorkspaceId { get; init; }
    public Guid UserId { get; init; }
}

public record UpdateMemberRoleCommand : IRequest<ApiResponse<WorkspaceMemberDto>>
{
    public Guid WorkspaceId { get; init; }
    public Guid UserId { get; init; }
    public string Role { get; init; } = string.Empty;
}

// --- Queries ---

public record GetWorkspaceQuery : IRequest<ApiResponse<WorkspaceDto>>
{
    public Guid Id { get; init; }
}

public record GetUserWorkspacesQuery : IRequest<ApiResponse<List<WorkspaceDto>>>
{
}

public record GetWorkspaceMembersQuery : IRequest<ApiResponse<List<WorkspaceMemberDto>>>
{
    public Guid WorkspaceId { get; init; }
}

// --- Response DTOs ---

public record WorkspaceDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? IconUrl { get; init; }
    public Guid OwnerId { get; init; }
    public string Plan { get; init; } = "free";
    public DateTime CreatedAt { get; init; }
    public int MemberCount { get; init; }
    public string? OwnerName { get; init; }
}

public record WorkspaceMemberDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserEmail { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string? UserAvatarUrl { get; init; }
    public string Role { get; init; } = string.Empty;
    public DateTime JoinedAt { get; init; }
}
