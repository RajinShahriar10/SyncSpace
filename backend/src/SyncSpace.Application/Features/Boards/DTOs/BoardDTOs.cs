using MediatR;
using SyncSpace.Application.Common.Models;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Application.Features.Boards.DTOs;

// --- Board Commands ---

public record CreateBoardCommand : IRequest<ApiResponse<BoardDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public record UpdateBoardCommand : IRequest<ApiResponse<BoardDto>>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
}

public record DeleteBoardCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

// --- Column Commands ---

public record CreateColumnCommand : IRequest<ApiResponse<ColumnDto>>
{
    public Guid BoardId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Color { get; init; }
}

public record UpdateColumnCommand : IRequest<ApiResponse<ColumnDto>>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Color { get; init; }
}

public record DeleteColumnCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

public record ReorderColumnsCommand : IRequest<ApiResponse<bool>>
{
    public Guid BoardId { get; init; }
    public List<Guid> ColumnIds { get; init; } = [];
}

// --- Card Commands ---

public record CreateCardCommand : IRequest<ApiResponse<CardDto>>
{
    public Guid ColumnId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
}

public record UpdateCardCommand : IRequest<ApiResponse<CardDto>>
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public CardPriority? Priority { get; init; }
    public DateTime? DueDate { get; init; }
}

public record DeleteCardCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

public record MoveCardCommand : IRequest<ApiResponse<CardDto>>
{
    public Guid CardId { get; init; }
    public Guid TargetColumnId { get; init; }
    public int NewOrder { get; init; }
}

public record ReorderCardsCommand : IRequest<ApiResponse<bool>>
{
    public Guid ColumnId { get; init; }
    public List<Guid> CardIds { get; init; } = [];
}

public record AssignCardCommand : IRequest<ApiResponse<CardDto>>
{
    public Guid CardId { get; init; }
    public Guid? UserId { get; init; }
}

// --- Label Commands ---

public record CreateLabelCommand : IRequest<ApiResponse<LabelDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Color { get; init; } = "#6366F1";
}

public record AddLabelToCardCommand : IRequest<ApiResponse<bool>>
{
    public Guid CardId { get; init; }
    public Guid LabelId { get; init; }
}

public record RemoveLabelFromCardCommand : IRequest<ApiResponse<bool>>
{
    public Guid CardId { get; init; }
    public Guid LabelId { get; init; }
}

public record DeleteLabelCommand : IRequest<ApiResponse<bool>>
{
    public Guid Id { get; init; }
}

// --- Comment Commands ---

public record AddCardCommentCommand : IRequest<ApiResponse<CardCommentDto>>
{
    public Guid CardId { get; init; }
    public string Content { get; init; } = string.Empty;
}

public record DeleteCardCommentCommand : IRequest<ApiResponse<bool>>
{
    public Guid CommentId { get; init; }
}

// --- Attachment Commands ---

public record AddCardAttachmentCommand : IRequest<ApiResponse<CardAttachmentDto>>
{
    public Guid CardId { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public long Size { get; init; }
    public string MimeType { get; init; } = string.Empty;
}

public record DeleteCardAttachmentCommand : IRequest<ApiResponse<bool>>
{
    public Guid AttachmentId { get; init; }
}

// --- Board Queries ---

public record GetBoardQuery : IRequest<ApiResponse<BoardDto>>
{
    public Guid Id { get; init; }
}

public record GetWorkspaceBoardsQuery : IRequest<ApiResponse<List<BoardDto>>>
{
    public Guid WorkspaceId { get; init; }
}

public record GetBoardWithCardsQuery : IRequest<ApiResponse<BoardWithCardsDto>>
{
    public Guid Id { get; init; }
}

public record GetBoardActivityQuery : IRequest<ApiResponse<List<ActivityDto>>>
{
    public Guid BoardId { get; init; }
    public int Limit { get; init; } = 50;
}

public record GetWorkspaceMembersQuery : IRequest<ApiResponse<List<BoardMemberDto>>>
{
    public Guid WorkspaceId { get; init; }
}

// --- DTOs ---

public record BoardDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid AuthorId { get; init; }
    public string AuthorName { get; init; } = string.Empty;
    public int ColumnCount { get; init; }
    public int CardCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record ColumnDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Color { get; init; }
    public int Order { get; init; }
    public int CardCount { get; init; }
}

public record CardDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid ColumnId { get; init; }
    public int Order { get; init; }
    public Guid? AssigneeId { get; init; }
    public string? AssigneeName { get; init; }
    public string? AssigneeAvatarUrl { get; init; }
    public DateTime? DueDate { get; init; }
    public CardPriority Priority { get; init; }
    public List<LabelDto> Labels { get; init; } = [];
    public int CommentCount { get; init; }
    public int AttachmentCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record LabelDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Color { get; init; } = "#6366F1";
}

public record CardCommentDto
{
    public Guid Id { get; init; }
    public string Content { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? UserAvatarUrl { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CardAttachmentDto
{
    public Guid Id { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public long Size { get; init; }
    public string MimeType { get; init; } = string.Empty;
    public string UploadedByName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public record ActivityDto
{
    public Guid Id { get; init; }
    public ActivityType ActivityType { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string? UserAvatarUrl { get; init; }
    public Guid? CardId { get; init; }
    public string? CardTitle { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record BoardMemberDto
{
    public Guid UserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string Email { get; init; } = string.Empty;
}

public record BoardWithCardsDto
{
    public BoardDto Board { get; init; } = null!;
    public List<ColumnWithCardsDto> Columns { get; init; } = [];
}

public record ColumnWithCardsDto
{
    public ColumnDto Column { get; init; } = null!;
    public List<CardDto> Cards { get; init; } = [];
}
