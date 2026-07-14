using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Documents.Commands;
using SyncSpace.Application.Features.Documents.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Documents.Queries;

public class GetDocumentQueryHandler : IRequestHandler<GetDocumentQuery, ApiResponse<DocumentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetDocumentQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DocumentDto>> Handle(GetDocumentQuery request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<Document>();
        var doc = await repo.GetByIdAsync(request.Id, ct);
        if (doc == null) return ApiResponse<DocumentDto>.NotFound("Document not found.");

        var versionRepo = _unitOfWork.Repository<DocumentVersion>();
        var versions = await versionRepo.GetAllAsync(ct);
        var maxVersion = versions.Where(v => v.DocumentId == doc.Id).DefaultIfEmpty().Max(v => v?.VersionNumber ?? 0);

        var user = await _identityService.GetUserInfoAsync(doc.AuthorId);
        return ApiResponse<DocumentDto>.SuccessResponse(DocumentMapper.MapDoc(doc, user, maxVersion));
    }
}

public class GetWorkspaceDocumentsQueryHandler : IRequestHandler<GetWorkspaceDocumentsQuery, ApiResponse<List<DocumentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetWorkspaceDocumentsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<DocumentDto>>> Handle(GetWorkspaceDocumentsQuery request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<Document>();
        var allDocs = await repo.GetAllAsync(ct);
        var docs = allDocs.Where(d => d.WorkspaceId == request.WorkspaceId).OrderByDescending(d => d.UpdatedAt).ToList();

        var versionRepo = _unitOfWork.Repository<DocumentVersion>();
        var allVersions = await versionRepo.GetAllAsync(ct);

        var dtos = new List<DocumentDto>();
        foreach (var doc in docs)
        {
            var maxVer = allVersions.Where(v => v.DocumentId == doc.Id).DefaultIfEmpty().Max(v => v?.VersionNumber ?? 0);
            var user = await _identityService.GetUserInfoAsync(doc.AuthorId);
            dtos.Add(DocumentMapper.MapDoc(doc, user, maxVer));
        }

        return ApiResponse<List<DocumentDto>>.SuccessResponse(dtos);
    }
}

public class GetDocumentVersionsQueryHandler : IRequestHandler<GetDocumentVersionsQuery, ApiResponse<List<DocumentVersionDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDocumentVersionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<DocumentVersionDto>>> Handle(GetDocumentVersionsQuery request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<DocumentVersion>();
        var versions = (await repo.GetAllAsync(ct))
            .Where(v => v.DocumentId == request.DocumentId)
            .OrderByDescending(v => v.VersionNumber)
            .Select(v => new DocumentVersionDto
            {
                VersionNumber = v.VersionNumber,
                Title = v.Title ?? "",
                ChangeDescription = v.ChangeDescription,
                AuthorName = v.AuthorName,
                CreatedAt = v.CreatedAt
            })
            .ToList();

        return ApiResponse<List<DocumentVersionDto>>.SuccessResponse(versions);
    }
}

public class GetDocumentCommentsQueryHandler : IRequestHandler<GetDocumentCommentsQuery, ApiResponse<List<CommentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetDocumentCommentsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<CommentDto>>> Handle(GetDocumentCommentsQuery request, CancellationToken ct)
    {
        var repo = _unitOfWork.Repository<DocumentComment>();
        var allComments = await repo.GetAllAsync(ct);
        var docComments = allComments.Where(c => c.DocumentId == request.DocumentId).ToList();

        var reactionRepo = _unitOfWork.Repository<DocumentCommentReaction>();
        var allReactions = await reactionRepo.GetAllAsync(ct);

        var dtos = new List<CommentDto>();
        foreach (var c in docComments.Where(c => c.ParentCommentId == null))
        {
            var user = await _identityService.GetUserInfoAsync(c.UserId);
            var replies = docComments.Where(r => r.ParentCommentId == c.Id).ToList();
            var commentReactions = allReactions.Where(r => r.CommentId == c.Id).ToList();

            var dto = MapComment(c, user, commentReactions);

            var replyDtos = new List<CommentDto>();
            foreach (var r in replies)
            {
                var ru = await _identityService.GetUserInfoAsync(r.UserId);
                var rr = allReactions.Where(rx => rx.CommentId == r.Id).ToList();
                replyDtos.Add(MapComment(r, ru, rr));
            }
            dto.Replies = replyDtos;
            dtos.Add(dto);
        }

        return ApiResponse<List<CommentDto>>.SuccessResponse(dtos);
    }

    private static CommentDto MapComment(DocumentComment c, UserInfo? user, List<DocumentCommentReaction> reactions)
    {
        var grouped = reactions.GroupBy(r => r.Emoji).Select(g => new ReactionDto
        {
            Emoji = g.Key,
            UserId = g.First().UserId,
            UserName = "",
            Count = g.Count()
        }).ToList();

        return new CommentDto
        {
            Id = c.Id,
            Content = c.Content,
            UserId = c.UserId,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            UserAvatarUrl = user?.AvatarUrl,
            PositionStart = c.PositionStart,
            PositionEnd = c.PositionEnd,
            SelectedText = c.SelectedText,
            IsResolved = c.IsResolved,
            ParentCommentId = c.ParentCommentId,
            CreatedAt = c.CreatedAt,
            Reactions = grouped
        };
    }
}
