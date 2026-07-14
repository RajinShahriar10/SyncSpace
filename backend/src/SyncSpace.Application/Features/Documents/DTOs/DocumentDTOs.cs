using MediatR;
using SyncSpace.Application.Common.Models;

namespace SyncSpace.Application.Features.Documents.DTOs;

// --- Commands ---

public record CreateDocumentCommand : IRequest<ApiResponse<DocumentDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Title { get; init; } = "Untitled";
    public string Content { get; init; } = "";
}

public record UpdateDocumentCommand : IRequest<ApiResponse<DocumentDto>>
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? Content { get; init; }
}

public record DeleteDocumentCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

public record RestoreVersionCommand : IRequest<ApiResponse<DocumentDto>>
{
    public Guid DocumentId { get; init; }
    public int VersionNumber { get; init; }
}

// --- Comment Commands ---

public record AddCommentCommand : IRequest<ApiResponse<CommentDto>>
{
    public Guid DocumentId { get; init; }
    public string Content { get; init; } = string.Empty;
    public int? PositionStart { get; init; }
    public int? PositionEnd { get; init; }
    public string? SelectedText { get; init; }
    public Guid? ParentCommentId { get; init; }
}

public record ResolveCommentCommand : IRequest<ApiResponse<bool>>
{
    public Guid CommentId { get; init; }
    public bool IsResolved { get; init; }
}

public record AddReactionCommand : IRequest<ApiResponse<ReactionDto>>
{
    public Guid CommentId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

public record RemoveReactionCommand : IRequest<ApiResponse<bool>>
{
    public Guid CommentId { get; init; }
    public string Emoji { get; init; } = string.Empty;
}

// --- Queries ---

public record GetDocumentQuery : IRequest<ApiResponse<DocumentDto>>
{
    public Guid Id { get; init; }
}

public record GetWorkspaceDocumentsQuery : IRequest<ApiResponse<List<DocumentDto>>>
{
    public Guid WorkspaceId { get; init; }
}

public record GetDocumentVersionsQuery : IRequest<ApiResponse<List<DocumentVersionDto>>>
{
    public Guid DocumentId { get; init; }
}

public record GetDocumentCommentsQuery : IRequest<ApiResponse<List<CommentDto>>>
{
    public Guid DocumentId { get; init; }
}

// --- DTOs ---

public record DocumentDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public Guid WorkspaceId { get; init; }
    public Guid AuthorId { get; init; }
    public string AuthorName { get; init; } = string.Empty;
    public string? AuthorAvatarUrl { get; init; }
    public bool IsPublished { get; init; }
    public int CurrentVersion { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record DocumentVersionDto
{
    public int VersionNumber { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? ChangeDescription { get; init; }
    public string? AuthorName { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CommentDto
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? UserAvatarUrl { get; init; }
    public int? PositionStart { get; init; }
    public int? PositionEnd { get; init; }
    public string? SelectedText { get; init; }
    public bool IsResolved { get; init; }
    public Guid? ParentCommentId { get; init; }
    public DateTime CreatedAt { get; init; }
    public List<CommentDto> Replies { get; set; } = [];
    public List<ReactionDto> Reactions { get; set; } = [];
}

public record ReactionDto
{
    public string Emoji { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public int Count { get; init; }
}
