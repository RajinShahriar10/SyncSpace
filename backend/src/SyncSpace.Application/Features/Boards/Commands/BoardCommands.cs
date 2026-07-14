using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Boards.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Boards.Commands;

public class CreateBoardCommandHandler : IRequestHandler<CreateBoardCommand, ApiResponse<BoardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public CreateBoardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<BoardDto>> Handle(CreateBoardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<BoardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var board = new Board
        {
            Name = request.Name,
            Description = request.Description,
            WorkspaceId = request.WorkspaceId,
            AuthorId = userId.Value,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<Board>().AddAsync(board, ct);

        // Create default columns
        var defaultColumns = new[] { "To Do", "In Progress", "Done" };
        for (int i = 0; i < defaultColumns.Length; i++)
        {
            await _unitOfWork.Repository<BoardColumn>().AddAsync(new BoardColumn
            {
                Name = defaultColumns[i],
                BoardId = board.Id,
                Order = i,
                Color = i == 0 ? "#6366F1" : i == 1 ? "#F59E0B" : "#10B981",
                CreatedBy = userId.Value.ToString()
            }, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<BoardDto>.SuccessResponse(BoardMapper.Map(board, user, 3, 0));
    }
}

public class UpdateBoardCommandHandler : IRequestHandler<UpdateBoardCommand, ApiResponse<BoardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateBoardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<BoardDto>> Handle(UpdateBoardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<BoardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Board>();
        var board = await repo.GetByIdAsync(request.Id, ct);
        if (board == null) return ApiResponse<BoardDto>.NotFound("Board not found.");

        if (request.Name != null) board.Name = request.Name;
        if (request.Description != null) board.Description = request.Description;
        repo.Update(board);
        await _unitOfWork.SaveChangesAsync(ct);

        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var cols = await colRepo.GetAllAsync(ct);
        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var cards = await cardRepo.GetAllAsync(ct);

        var user = await _identityService.GetUserInfoAsync(board.AuthorId);
        return ApiResponse<BoardDto>.SuccessResponse(BoardMapper.Map(board, user,
            cols.Count(c => c.BoardId == board.Id),
            cards.Count(c => cols.Any(col => col.BoardId == board.Id && col.Id == c.ColumnId))));
    }
}

public class DeleteBoardCommandHandler : IRequestHandler<DeleteBoardCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteBoardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteBoardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Board>();
        var board = await repo.GetByIdAsync(request.Id, ct);
        if (board == null) return ApiResponse<bool>.NotFound("Board not found.");

        // Delete columns and cards
        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var cols = (await colRepo.GetAllAsync(ct)).Where(c => c.BoardId == board.Id).ToList();
        foreach (var col in cols)
        {
            var cards = (await cardRepo.GetAllAsync(ct)).Where(c => c.ColumnId == col.Id);
            foreach (var card in cards) cardRepo.Delete(card);
            colRepo.Delete(col);
        }

        repo.Delete(board);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true, "Board deleted.");
    }
}

public class CreateColumnCommandHandler : IRequestHandler<CreateColumnCommand, ApiResponse<ColumnDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateColumnCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ColumnDto>> Handle(CreateColumnCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ColumnDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var existing = (await colRepo.GetAllAsync(ct)).Where(c => c.BoardId == request.BoardId);
        var maxOrder = existing.Any() ? existing.Max(c => c.Order) + 1 : 0;

        var column = new BoardColumn
        {
            Name = request.Name,
            Color = request.Color,
            BoardId = request.BoardId,
            Order = maxOrder,
            CreatedBy = userId.Value.ToString()
        };

        await colRepo.AddAsync(column, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<ColumnDto>.SuccessResponse(new ColumnDto
        {
            Id = column.Id,
            Name = column.Name,
            Color = column.Color,
            Order = column.Order,
            CardCount = 0
        });
    }
}

public class UpdateColumnCommandHandler : IRequestHandler<UpdateColumnCommand, ApiResponse<ColumnDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public UpdateColumnCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<ColumnDto>> Handle(UpdateColumnCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<ColumnDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardColumn>();
        var col = await repo.GetByIdAsync(request.Id, ct);
        if (col == null) return ApiResponse<ColumnDto>.NotFound("Column not found.");

        if (request.Name != null) col.Name = request.Name;
        if (request.Color != null) col.Color = request.Color;
        repo.Update(col);

        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var cards = await cardRepo.GetAllAsync(ct);
        var cardCount = cards.Count(c => c.ColumnId == col.Id);

        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<ColumnDto>.SuccessResponse(new ColumnDto
        {
            Id = col.Id,
            Name = col.Name,
            Color = col.Color,
            Order = col.Order,
            CardCount = cardCount
        });
    }
}

public class DeleteColumnCommandHandler : IRequestHandler<DeleteColumnCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteColumnCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteColumnCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var col = await colRepo.GetByIdAsync(request.Id, ct);
        if (col == null) return ApiResponse<bool>.NotFound("Column not found.");

        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var cards = (await cardRepo.GetAllAsync(ct)).Where(c => c.ColumnId == col.Id);
        foreach (var card in cards) cardRepo.Delete(card);

        colRepo.Delete(col);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true, "Column deleted.");
    }
}

public class ReorderColumnsCommandHandler : IRequestHandler<ReorderColumnsCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public ReorderColumnsCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(ReorderColumnsCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardColumn>();
        var cols = (await repo.GetAllAsync(ct)).Where(c => c.BoardId == request.BoardId).ToList();

        for (int i = 0; i < request.ColumnIds.Count; i++)
        {
            var col = cols.FirstOrDefault(c => c.Id == request.ColumnIds[i]);
            if (col != null) { col.Order = i; repo.Update(col); }
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class CreateCardCommandHandler : IRequestHandler<CreateCardCommand, ApiResponse<CardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public CreateCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardDto>> Handle(CreateCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var existing = (await cardRepo.GetAllAsync(ct)).Where(c => c.ColumnId == request.ColumnId);
        var maxOrder = existing.Any() ? existing.Max(c => c.Order) + 1 : 0;

        var card = new BoardCard
        {
            Title = request.Title,
            Description = request.Description,
            ColumnId = request.ColumnId,
            Order = maxOrder,
            CreatedBy = userId.Value.ToString()
        };

        await cardRepo.AddAsync(card, ct);

        // Log activity
        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var col = await colRepo.GetByIdAsync(request.ColumnId, ct);
        if (col != null)
        {
            await BoardCommandHelpers.LogActivity(_unitOfWork, col.BoardId, card.Id, userId.Value,
                ActivityType.Created, $"Created card \"{card.Title}\" in {col.Name}");
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<CardDto>.SuccessResponse(CardMapper.Map(card, null, [], 0, 0));
    }
}

public class UpdateCardCommandHandler : IRequestHandler<UpdateCardCommand, ApiResponse<CardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardDto>> Handle(UpdateCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCard>();
        var card = await repo.GetByIdAsync(request.Id, ct);
        if (card == null) return ApiResponse<CardDto>.NotFound("Card not found.");

        if (request.Title != null) card.Title = request.Title;
        if (request.Description != null) card.Description = request.Description;
        if (request.Priority.HasValue && request.Priority.Value != card.Priority)
        {
            var old = card.Priority.ToString();
            card.Priority = request.Priority.Value;
            await BoardCommandHelpers.LogActivityForCard(_unitOfWork, card, userId.Value,
                ActivityType.PriorityChanged, $"Changed priority to {card.Priority}", old, card.Priority.ToString());
        }
        if (request.DueDate.HasValue && request.DueDate.Value != card.DueDate)
        {
            var old = card.DueDate?.ToString("yyyy-MM-dd") ?? "none";
            card.DueDate = request.DueDate.Value;
            await BoardCommandHelpers.LogActivityForCard(_unitOfWork, card, userId.Value,
                ActivityType.DueDateChanged, $"Set due date to {card.DueDate:yyyy-MM-dd}", old, card.DueDate.Value.ToString("yyyy-MM-dd"));
        }
        repo.Update(card);
        await _unitOfWork.SaveChangesAsync(ct);

        var labels = await BoardCommandHelpers.GetCardLabels(_unitOfWork, card.Id);
        var assignee = card.AssigneeId.HasValue ? await _identityService.GetUserInfoAsync(card.AssigneeId.Value) : null;
        var commentRepo = _unitOfWork.Repository<BoardCardComment>();
        var allComments = await commentRepo.GetAllAsync(ct);
        var attachRepo = _unitOfWork.Repository<BoardCardAttachment>();
        var allAttach = await attachRepo.GetAllAsync(ct);

        return ApiResponse<CardDto>.SuccessResponse(CardMapper.Map(card, assignee, labels,
            allComments.Count(c => c.CardId == card.Id),
            allAttach.Count(a => a.CardId == card.Id)));
    }
}

public class DeleteCardCommandHandler : IRequestHandler<DeleteCardCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCard>();
        var card = await repo.GetByIdAsync(request.Id, ct);
        if (card == null) return ApiResponse<bool>.NotFound("Card not found.");

        repo.Delete(card);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true, "Card deleted.");
    }
}

public class MoveCardCommandHandler : IRequestHandler<MoveCardCommand, ApiResponse<CardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public MoveCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardDto>> Handle(MoveCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var cardRepo = _unitOfWork.Repository<BoardCard>();
        var card = await cardRepo.GetByIdAsync(request.CardId, ct);
        if (card == null) return ApiResponse<CardDto>.NotFound("Card not found.");

        var colRepo = _unitOfWork.Repository<BoardColumn>();
        var oldCol = await colRepo.GetByIdAsync(card.ColumnId, ct);
        var newCol = await colRepo.GetByIdAsync(request.TargetColumnId, ct);
        if (newCol == null) return ApiResponse<CardDto>.NotFound("Target column not found.");

        var oldColName = oldCol?.Name ?? "Unknown";
        card.ColumnId = request.TargetColumnId;
        card.Order = request.NewOrder;
        cardRepo.Update(card);

        // Reorder other cards in target column
        var allCards = (await cardRepo.GetAllAsync(ct))
            .Where(c => c.ColumnId == request.TargetColumnId && c.Id != card.Id)
            .OrderBy(c => c.Order).ToList();
        for (int i = 0; i < allCards.Count; i++)
        {
            if (i >= request.NewOrder)
            {
                allCards[i].Order = i + 1;
                cardRepo.Update(allCards[i]);
            }
        }

        if (oldCol?.Id != newCol.Id)
        {
            await BoardCommandHelpers.LogActivity(_unitOfWork, newCol.BoardId, card.Id, userId.Value,
                ActivityType.Moved, $"Moved \"{card.Title}\" from {oldColName} to {newCol.Name}");
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var labels = await BoardCommandHelpers.GetCardLabels(_unitOfWork, card.Id);
        var assignee = card.AssigneeId.HasValue ? await _identityService.GetUserInfoAsync(card.AssigneeId.Value) : null;
        var commentRepo = _unitOfWork.Repository<BoardCardComment>();
        var allComments = await commentRepo.GetAllAsync(ct);
        var attachRepo = _unitOfWork.Repository<BoardCardAttachment>();
        var allAttach = await attachRepo.GetAllAsync(ct);

        return ApiResponse<CardDto>.SuccessResponse(CardMapper.Map(card, assignee, labels,
            allComments.Count(c => c.CardId == card.Id),
            allAttach.Count(a => a.CardId == card.Id)));
    }
}

public class ReorderCardsCommandHandler : IRequestHandler<ReorderCardsCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public ReorderCardsCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(ReorderCardsCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCard>();
        var cards = (await repo.GetAllAsync(ct)).Where(c => c.ColumnId == request.ColumnId).ToList();

        for (int i = 0; i < request.CardIds.Count; i++)
        {
            var card = cards.FirstOrDefault(c => c.Id == request.CardIds[i]);
            if (card != null) { card.Order = i; repo.Update(card); }
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AssignCardCommandHandler : IRequestHandler<AssignCardCommand, ApiResponse<CardDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public AssignCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardDto>> Handle(AssignCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCard>();
        var card = await repo.GetByIdAsync(request.CardId, ct);
        if (card == null) return ApiResponse<CardDto>.NotFound("Card not found.");

        var oldAssignee = card.AssigneeId;
        card.AssigneeId = request.UserId;
        repo.Update(card);

        if (request.UserId.HasValue && request.UserId.Value != oldAssignee)
        {
            var assigneeInfo = await _identityService.GetUserInfoAsync(request.UserId.Value);
            var name = assigneeInfo != null ? $"{assigneeInfo.FirstName} {assigneeInfo.LastName}" : "Unknown";
            await BoardCommandHelpers.LogActivityForCard(_unitOfWork, card, userId.Value,
                ActivityType.Assigned, $"Assigned {name} to \"{card.Title}\"");
        }
        else if (!request.UserId.HasValue && oldAssignee.HasValue)
        {
            await BoardCommandHelpers.LogActivityForCard(_unitOfWork, card, userId.Value,
                ActivityType.Unassigned, $"Unassigned from \"{card.Title}\"");
        }

        await _unitOfWork.SaveChangesAsync(ct);

        var assignee = request.UserId.HasValue ? await _identityService.GetUserInfoAsync(request.UserId.Value) : null;
        var labels = await BoardCommandHelpers.GetCardLabels(_unitOfWork, card.Id);
        var commentRepo = _unitOfWork.Repository<BoardCardComment>();
        var allComments = await commentRepo.GetAllAsync(ct);
        var attachRepo = _unitOfWork.Repository<BoardCardAttachment>();
        var allAttach = await attachRepo.GetAllAsync(ct);

        return ApiResponse<CardDto>.SuccessResponse(CardMapper.Map(card, assignee, labels,
            allComments.Count(c => c.CardId == card.Id),
            allAttach.Count(a => a.CardId == card.Id)));
    }
}

public class CreateLabelCommandHandler : IRequestHandler<CreateLabelCommand, ApiResponse<LabelDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateLabelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<LabelDto>> Handle(CreateLabelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<LabelDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var label = new Label
        {
            Name = request.Name,
            Color = request.Color,
            WorkspaceId = request.WorkspaceId,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<Label>().AddAsync(label, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<LabelDto>.SuccessResponse(new LabelDto { Id = label.Id, Name = label.Name, Color = label.Color });
    }
}

public class AddLabelToCardCommandHandler : IRequestHandler<AddLabelToCardCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AddLabelToCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(AddLabelToCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<CardLabel>();
        var all = await repo.GetAllAsync(ct);
        if (all.Any(cl => cl.CardId == request.CardId && cl.LabelId == request.LabelId))
            return ApiResponse<bool>.Failure("Label already on card.");

        await repo.AddAsync(new CardLabel { CardId = request.CardId, LabelId = request.LabelId, CreatedBy = userId.Value.ToString() }, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class RemoveLabelFromCardCommandHandler : IRequestHandler<RemoveLabelFromCardCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RemoveLabelFromCardCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(RemoveLabelFromCardCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<CardLabel>();
        var all = await repo.GetAllAsync(ct);
        var cl = all.FirstOrDefault(x => x.CardId == request.CardId && x.LabelId == request.LabelId);
        if (cl == null) return ApiResponse<bool>.NotFound("Label not on card.");

        repo.Delete(cl);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class DeleteLabelCommandHandler : IRequestHandler<DeleteLabelCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteLabelCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteLabelCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Label>();
        var label = await repo.GetByIdAsync(request.Id, ct);
        if (label == null) return ApiResponse<bool>.NotFound("Label not found.");

        // Remove from all cards
        var clRepo = _unitOfWork.Repository<CardLabel>();
        var cardLabels = (await clRepo.GetAllAsync(ct)).Where(cl => cl.LabelId == label.Id);
        foreach (var cl in cardLabels) clRepo.Delete(cl);

        repo.Delete(label);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AddCardCommentCommandHandler : IRequestHandler<AddCardCommentCommand, ApiResponse<CardCommentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public AddCardCommentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardCommentDto>> Handle(AddCardCommentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardCommentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var comment = new BoardCardComment
        {
            CardId = request.CardId,
            UserId = userId.Value,
            Content = request.Content,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<BoardCardComment>().AddAsync(comment, ct);
        await BoardCommandHelpers.LogActivityForCardId(_unitOfWork, request.CardId, userId.Value,
            ActivityType.CommentAdded, $"Added a comment");
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<CardCommentDto>.SuccessResponse(new CardCommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            UserId = userId.Value,
            UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            UserAvatarUrl = user?.AvatarUrl,
            CreatedAt = comment.CreatedAt
        });
    }
}

public class DeleteCardCommentCommandHandler : IRequestHandler<DeleteCardCommentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteCardCommentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteCardCommentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCardComment>();
        var comment = await repo.GetByIdAsync(request.CommentId, ct);
        if (comment == null) return ApiResponse<bool>.NotFound("Comment not found.");

        repo.Delete(comment);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

public class AddCardAttachmentCommandHandler : IRequestHandler<AddCardAttachmentCommand, ApiResponse<CardAttachmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public AddCardAttachmentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<CardAttachmentDto>> Handle(AddCardAttachmentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<CardAttachmentDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var attachment = new BoardCardAttachment
        {
            CardId = request.CardId,
            Filename = request.Filename,
            Url = request.Url,
            Size = request.Size,
            MimeType = request.MimeType,
            UploadedById = userId.Value,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<BoardCardAttachment>().AddAsync(attachment, ct);
        await BoardCommandHelpers.LogActivityForCardId(_unitOfWork, request.CardId, userId.Value,
            ActivityType.AttachmentAdded, $"Added attachment \"{request.Filename}\"");
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<CardAttachmentDto>.SuccessResponse(new CardAttachmentDto
        {
            Id = attachment.Id,
            Filename = attachment.Filename,
            Url = attachment.Url,
            Size = attachment.Size,
            MimeType = attachment.MimeType,
            UploadedByName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            CreatedAt = attachment.CreatedAt
        });
    }
}

public class DeleteCardAttachmentCommandHandler : IRequestHandler<DeleteCardAttachmentCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteCardAttachmentCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteCardAttachmentCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<BoardCardAttachment>();
        var attachment = await repo.GetByIdAsync(request.AttachmentId, ct);
        if (attachment == null) return ApiResponse<bool>.NotFound("Attachment not found.");

        repo.Delete(attachment);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Helpers ---

internal static class BoardMapper
{
    public static BoardDto Map(Board board, UserInfo? user, int colCount, int cardCount)
    {
        return new BoardDto
        {
            Id = board.Id,
            Name = board.Name,
            Description = board.Description,
            WorkspaceId = board.WorkspaceId,
            AuthorId = board.AuthorId,
            AuthorName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            ColumnCount = colCount,
            CardCount = cardCount,
            CreatedAt = board.CreatedAt,
            UpdatedAt = board.UpdatedAt
        };
    }
}

internal static class CardMapper
{
    public static CardDto Map(BoardCard card, UserInfo? assignee, List<LabelDto> labels, int commentCount, int attachmentCount)
    {
        return new CardDto
        {
            Id = card.Id,
            Title = card.Title,
            Description = card.Description,
            ColumnId = card.ColumnId,
            Order = card.Order,
            AssigneeId = card.AssigneeId,
            AssigneeName = assignee != null ? $"{assignee.FirstName} {assignee.LastName}" : null,
            AssigneeAvatarUrl = assignee?.AvatarUrl,
            DueDate = card.DueDate,
            Priority = card.Priority,
            Labels = labels,
            CommentCount = commentCount,
            AttachmentCount = attachmentCount,
            CreatedAt = card.CreatedAt,
            UpdatedAt = card.UpdatedAt
        };
    }
}

internal static class BoardCommandHelpers
{
    public static async Task<List<LabelDto>> GetCardLabels(IUnitOfWork unitOfWork, Guid cardId)
    {
        var clRepo = unitOfWork.Repository<CardLabel>();
        var labelRepo = unitOfWork.Repository<Label>();
        var allCL = await clRepo.GetAllAsync();
        var allLabels = await labelRepo.GetAllAsync();
        var labelIds = allCL.Where(cl => cl.CardId == cardId).Select(cl => cl.LabelId);
        return allLabels.Where(l => labelIds.Contains(l.Id))
            .Select(l => new LabelDto { Id = l.Id, Name = l.Name, Color = l.Color }).ToList();
    }

    public static async Task LogActivity(IUnitOfWork unitOfWork, Guid boardId, Guid? cardId, Guid userId,
        ActivityType type, string description, string? oldValue = null, string? newValue = null)
    {
        await unitOfWork.Repository<BoardActivity>().AddAsync(new BoardActivity
        {
            BoardId = boardId,
            CardId = cardId,
            UserId = userId,
            ActivityType = type,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedBy = userId.ToString()
        });
    }

    public static async Task LogActivityForCard(IUnitOfWork unitOfWork, BoardCard card, Guid userId,
        ActivityType type, string description, string? oldValue = null, string? newValue = null)
    {
        var col = await unitOfWork.Repository<BoardColumn>().GetByIdAsync(card.ColumnId);
        if (col != null)
            await LogActivity(unitOfWork, col.BoardId, card.Id, userId, type, description, oldValue, newValue);
    }

    public static async Task LogActivityForCardId(IUnitOfWork unitOfWork, Guid cardId, Guid userId,
        ActivityType type, string description, string? oldValue = null, string? newValue = null)
    {
        var card = await unitOfWork.Repository<BoardCard>().GetByIdAsync(cardId);
        if (card != null)
            await LogActivityForCard(unitOfWork, card, userId, type, description, oldValue, newValue);
    }
}
