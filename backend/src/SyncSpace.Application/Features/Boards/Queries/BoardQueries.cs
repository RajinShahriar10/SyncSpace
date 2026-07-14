using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Boards.DTOs;
using SyncSpace.Application.Features.Boards.Commands;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Boards.Queries;

public class GetBoardQueryHandler : IRequestHandler<GetBoardQuery, ApiResponse<BoardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetBoardQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<BoardDto>> Handle(GetBoardQuery request, CancellationToken ct)
    {
        var board = await _unitOfWork.Repository<Board>().GetByIdAsync(request.Id, ct);
        if (board == null) return ApiResponse<BoardDto>.NotFound("Board not found.");

        var cols = (await _unitOfWork.Repository<BoardColumn>().GetAllAsync(ct)).Count(c => c.BoardId == board.Id);
        var allCards = await _unitOfWork.Repository<BoardCard>().GetAllAsync(ct);
        var allCols = (await _unitOfWork.Repository<BoardColumn>().GetAllAsync(ct)).Where(c => c.BoardId == board.Id).Select(c => c.Id).ToHashSet();
        var cards = allCards.Count(c => allCols.Contains(c.ColumnId));

        var user = await _identityService.GetUserInfoAsync(board.AuthorId);
        return ApiResponse<BoardDto>.SuccessResponse(BoardMapper.Map(board, user, cols, cards));
    }
}

public class GetWorkspaceBoardsQueryHandler : IRequestHandler<GetWorkspaceBoardsQuery, ApiResponse<List<BoardDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetWorkspaceBoardsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<BoardDto>>> Handle(GetWorkspaceBoardsQuery request, CancellationToken ct)
    {
        var boards = (await _unitOfWork.Repository<Board>().GetAllAsync(ct))
            .Where(b => b.WorkspaceId == request.WorkspaceId)
            .OrderByDescending(b => b.UpdatedAt).ToList();

        var cols = await _unitOfWork.Repository<BoardColumn>().GetAllAsync(ct);
        var cards = await _unitOfWork.Repository<BoardCard>().GetAllAsync(ct);

        var dtos = new List<BoardDto>();
        foreach (var board in boards)
        {
            var boardColIds = cols.Where(c => c.BoardId == board.Id).Select(c => c.Id).ToHashSet();
            var colCount = boardColIds.Count;
            var cardCount = cards.Count(c => boardColIds.Contains(c.ColumnId));

            var user = await _identityService.GetUserInfoAsync(board.AuthorId);
            dtos.Add(BoardMapper.Map(board, user, colCount, cardCount));
        }

        return ApiResponse<List<BoardDto>>.SuccessResponse(dtos);
    }
}

public class GetBoardWithCardsQueryHandler : IRequestHandler<GetBoardWithCardsQuery, ApiResponse<BoardWithCardsDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetBoardWithCardsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<BoardWithCardsDto>> Handle(GetBoardWithCardsQuery request, CancellationToken ct)
    {
        var board = await _unitOfWork.Repository<Board>().GetByIdAsync(request.Id, ct);
        if (board == null) return ApiResponse<BoardWithCardsDto>.NotFound("Board not found.");

        var allCols = (await _unitOfWork.Repository<BoardColumn>().GetAllAsync(ct))
            .Where(c => c.BoardId == board.Id).OrderBy(c => c.Order).ToList();
        var allCards = await _unitOfWork.Repository<BoardCard>().GetAllAsync(ct);
        var allCardLabels = await _unitOfWork.Repository<CardLabel>().GetAllAsync(ct);
        var allLabels = await _unitOfWork.Repository<Label>().GetAllAsync(ct);
        var allComments = await _unitOfWork.Repository<BoardCardComment>().GetAllAsync(ct);
        var allAttach = await _unitOfWork.Repository<BoardCardAttachment>().GetAllAsync(ct);

        var colDtos = new List<ColumnWithCardsDto>();
        foreach (var col in allCols)
        {
            var colCards = allCards.Where(c => c.ColumnId == col.Id).OrderBy(c => c.Order).ToList();
            var cardDtos = new List<CardDto>();

            foreach (var card in colCards)
            {
                var labelIds = allCardLabels.Where(cl => cl.CardId == card.Id).Select(cl => cl.LabelId).ToHashSet();
                var labels = allLabels.Where(l => labelIds.Contains(l.Id))
                    .Select(l => new LabelDto { Id = l.Id, Name = l.Name, Color = l.Color }).ToList();

                UserInfo? assignee = card.AssigneeId.HasValue ? await _identityService.GetUserInfoAsync(card.AssigneeId.Value) : null;
                var commentCount = allComments.Count(c => c.CardId == card.Id);
                var attachCount = allAttach.Count(a => a.CardId == card.Id);

                cardDtos.Add(CardMapper.Map(card, assignee, labels, commentCount, attachCount));
            }

            colDtos.Add(new ColumnWithCardsDto
            {
                Column = new ColumnDto
                {
                    Id = col.Id,
                    Name = col.Name,
                    Color = col.Color,
                    Order = col.Order,
                    CardCount = colCards.Count
                },
                Cards = cardDtos
            });
        }

        var boardUser = await _identityService.GetUserInfoAsync(board.AuthorId);
        var totalCards = colDtos.Sum(c => c.Cards.Count);

        return ApiResponse<BoardWithCardsDto>.SuccessResponse(new BoardWithCardsDto
        {
            Board = BoardMapper.Map(board, boardUser, allCols.Count, totalCards),
            Columns = colDtos
        });
    }
}

public class GetBoardActivityQueryHandler : IRequestHandler<GetBoardActivityQuery, ApiResponse<List<ActivityDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetBoardActivityQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<ActivityDto>>> Handle(GetBoardActivityQuery request, CancellationToken ct)
    {
        var activities = (await _unitOfWork.Repository<BoardActivity>().GetAllAsync(ct))
            .Where(a => a.BoardId == request.BoardId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(request.Limit).ToList();

        var dtos = new List<ActivityDto>();
        foreach (var a in activities)
        {
            var user = await _identityService.GetUserInfoAsync(a.UserId);
            string? cardTitle = null;
            if (a.CardId.HasValue)
            {
                var card = await _unitOfWork.Repository<BoardCard>().GetByIdAsync(a.CardId.Value, ct);
                cardTitle = card?.Title;
            }

            dtos.Add(new ActivityDto
            {
                Id = a.Id,
                ActivityType = a.ActivityType,
                Description = a.Description,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                UserId = a.UserId,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                UserAvatarUrl = user?.AvatarUrl,
                CardId = a.CardId,
                CardTitle = cardTitle,
                CreatedAt = a.CreatedAt
            });
        }

        return ApiResponse<List<ActivityDto>>.SuccessResponse(dtos);
    }
}

public class GetWorkspaceMembersQueryHandler : IRequestHandler<GetWorkspaceMembersQuery, ApiResponse<List<BoardMemberDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetWorkspaceMembersQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<BoardMemberDto>>> Handle(GetWorkspaceMembersQuery request, CancellationToken ct)
    {
        var members = (await _unitOfWork.Repository<WorkspaceMember>().GetAllAsync(ct))
            .Where(m => m.WorkspaceId == request.WorkspaceId).ToList();

        var dtos = new List<BoardMemberDto>();
        foreach (var m in members)
        {
            var user = await _identityService.GetUserInfoAsync(m.UserId);
            if (user != null)
            {
                dtos.Add(new BoardMemberDto
                {
                    UserId = m.UserId,
                    Name = $"{user.FirstName} {user.LastName}",
                    AvatarUrl = user.AvatarUrl,
                    Email = user.Email
                });
            }
        }

        return ApiResponse<List<BoardMemberDto>>.SuccessResponse(dtos);
    }
}
