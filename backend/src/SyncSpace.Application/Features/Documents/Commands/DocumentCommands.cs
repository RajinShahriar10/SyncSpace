using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Documents.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Documents.Commands;

public class CreateDocumentCommandHandler : IRequestHandler<CreateDocumentCommand, ApiResponse<DocumentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public CreateDocumentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DocumentDto>> Handle(CreateDocumentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<DocumentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var doc = new Document
        {
            Title = request.Title,
            Content = request.Content,
            WorkspaceId = request.WorkspaceId,
            AuthorId = userId.Value,
            IsPublished = false,
            CreatedBy = userId.Value.ToString()
        };

        var repo = _unitOfWork.Repository<Document>();
        await repo.AddAsync(doc, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Create initial version
        var versionRepo = _unitOfWork.Repository<DocumentVersion>();
        var user = await _identityService.GetUserInfoAsync(userId.Value);
        await versionRepo.AddAsync(new DocumentVersion
        {
            DocumentId = doc.Id,
            Content = request.Content,
            Title = request.Title,
            AuthorId = userId.Value,
            AuthorName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            VersionNumber = 1,
            ChangeDescription = "Initial version",
            CreatedBy = userId.Value.ToString()
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<DocumentDto>.SuccessResponse(DocumentMapper.MapDoc(doc, user, 1));
    }
}

public class UpdateDocumentCommandHandler : IRequestHandler<UpdateDocumentCommand, ApiResponse<DocumentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateDocumentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DocumentDto>> Handle(UpdateDocumentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<DocumentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Document>();
        var doc = await repo.GetByIdAsync(request.Id, ct);
        if (doc == null)
            return ApiResponse<DocumentDto>.NotFound("Document not found.");

        if (request.Title != null) doc.Title = request.Title;
        if (request.Content != null) doc.Content = request.Content;
        repo.Update(doc);

        // Create version snapshot
        var versionRepo = _unitOfWork.Repository<DocumentVersion>();
        var versions = await versionRepo.GetAllAsync(ct);
        var maxVersion = versions.Where(v => v.DocumentId == doc.Id).DefaultIfEmpty().Max(v => v?.VersionNumber ?? 0);
        var user = await _identityService.GetUserInfoAsync(userId.Value);

        await versionRepo.AddAsync(new DocumentVersion
        {
            DocumentId = doc.Id,
            Content = doc.Content,
            Title = doc.Title,
            AuthorId = userId.Value,
            AuthorName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            VersionNumber = maxVersion + 1,
            CreatedBy = userId.Value.ToString()
        }, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<DocumentDto>.SuccessResponse(DocumentMapper.MapDoc(doc, user, maxVersion + 1));
    }
}

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteDocumentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteDocumentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Document>();
        var doc = await repo.GetByIdAsync(request.Id, ct);
        if (doc == null) return ApiResponse<bool>.NotFound("Document not found.");

        repo.Delete(doc);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true, "Document deleted.");
    }
}

public class RestoreVersionCommandHandler : IRequestHandler<RestoreVersionCommand, ApiResponse<DocumentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public RestoreVersionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DocumentDto>> Handle(RestoreVersionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DocumentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var docRepo = _unitOfWork.Repository<Document>();
        var doc = await docRepo.GetByIdAsync(request.DocumentId, ct);
        if (doc == null) return ApiResponse<DocumentDto>.NotFound("Document not found.");

        var versionRepo = _unitOfWork.Repository<DocumentVersion>();
        var versions = await versionRepo.GetAllAsync(ct);
        var version = versions.FirstOrDefault(v => v.DocumentId == request.DocumentId && v.VersionNumber == request.VersionNumber);
        if (version == null) return ApiResponse<DocumentDto>.NotFound("Version not found.");

        doc.Content = version.Content;
        if (version.Title != null) doc.Title = version.Title;
        docRepo.Update(doc);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        var maxVersion = versions.Where(v => v.DocumentId == doc.Id).Max(v => v.VersionNumber);

        await versionRepo.AddAsync(new DocumentVersion
        {
            DocumentId = doc.Id,
            Content = doc.Content,
            Title = doc.Title,
            AuthorId = userId.Value,
            AuthorName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            VersionNumber = maxVersion + 1,
            ChangeDescription = $"Restored from version {request.VersionNumber}",
            CreatedBy = userId.Value.ToString()
        }, ct);

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<DocumentDto>.SuccessResponse(DocumentMapper.MapDoc(doc, user, maxVersion + 1));
    }
}

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, ApiResponse<CommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public AddCommentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CommentDto>> Handle(AddCommentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CommentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var comment = new DocumentComment
        {
            DocumentId = request.DocumentId,
            UserId = userId.Value,
            Content = request.Content,
            PositionStart = request.PositionStart,
            PositionEnd = request.PositionEnd,
            SelectedText = request.SelectedText,
            ParentCommentId = request.ParentCommentId,
            CreatedBy = userId.Value.ToString()
        };

        var repo = _unitOfWork.Repository<DocumentComment>();
        await repo.AddAsync(comment, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<CommentDto>.SuccessResponse(new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            UserId = userId.Value,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            UserAvatarUrl = user?.AvatarUrl,
            PositionStart = comment.PositionStart,
            PositionEnd = comment.PositionEnd,
            SelectedText = comment.SelectedText,
            IsResolved = false,
            ParentCommentId = comment.ParentCommentId,
            CreatedAt = comment.CreatedAt
        });
    }
}

public class ResolveCommentCommandHandler : IRequestHandler<ResolveCommentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public ResolveCommentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(ResolveCommentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DocumentComment>();
        var comment = await repo.GetByIdAsync(request.CommentId, ct);
        if (comment == null) return ApiResponse<bool>.NotFound("Comment not found.");

        comment.IsResolved = request.IsResolved;
        repo.Update(comment);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AddReactionCommandHandler : IRequestHandler<AddReactionCommand, ApiResponse<ReactionDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AddReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ReactionDto>> Handle(AddReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ReactionDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DocumentCommentReaction>();
        var allReactions = await repo.GetAllAsync(ct);
        var existing = allReactions.FirstOrDefault(r => r.CommentId == request.CommentId && r.UserId == userId.Value && r.Emoji == request.Emoji);
        if (existing != null)
            return ApiResponse<ReactionDto>.Failure("Reaction already added.");

        await repo.AddAsync(new DocumentCommentReaction
        {
            CommentId = request.CommentId,
            UserId = userId.Value,
            Emoji = request.Emoji,
            CreatedBy = userId.Value.ToString()
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var reactions = await repo.GetAllAsync(ct);
        var count = reactions.Count(r => r.CommentId == request.CommentId && r.Emoji == request.Emoji);

        return ApiResponse<ReactionDto>.SuccessResponse(new ReactionDto
        {
            Emoji = request.Emoji,
            UserId = userId.Value,
            Count = count
        });
    }
}

public class RemoveReactionCommandHandler : IRequestHandler<RemoveReactionCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RemoveReactionCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(RemoveReactionCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DocumentCommentReaction>();
        var allReactions = await repo.GetAllAsync(ct);
        var reaction = allReactions.FirstOrDefault(r => r.CommentId == request.CommentId && r.UserId == userId.Value && r.Emoji == request.Emoji);
        if (reaction == null) return ApiResponse<bool>.NotFound("Reaction not found.");

        repo.Delete(reaction);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Helper ---

internal static class DocumentMapper
{
    public static DocumentDto MapDoc(Document doc, UserInfo? user, int version)
    {
        return new DocumentDto
        {
            Id = doc.Id,
            Title = doc.Title,
            Content = doc.Content,
            WorkspaceId = doc.WorkspaceId,
            AuthorId = doc.AuthorId,
            AuthorName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            AuthorAvatarUrl = user?.AvatarUrl,
            IsPublished = doc.IsPublished,
            CurrentVersion = version,
            CreatedAt = doc.CreatedAt,
            UpdatedAt = doc.UpdatedAt
        };
    }
}
