using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Workspace.DTOs;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Workspace.Commands;

// --- Create Workspace ---

public class CreateWorkspaceCommandHandler : IRequestHandler<CreateWorkspaceCommand, ApiResponse<WorkspaceDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateWorkspaceCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<WorkspaceDto>> Handle(CreateWorkspaceCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<WorkspaceDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Domain.Entities.Workspace>();

        var slug = string.IsNullOrEmpty(request.Slug)
            ? request.Name.ToLower().Replace(" ", "-")
            : request.Slug;

        var allWorkspaces = await repo.GetAllAsync(ct);
        if (allWorkspaces.Any(w => w.Slug == slug))
            return ApiResponse<WorkspaceDto>.Failure("A workspace with this slug already exists.");

        var workspace = new Domain.Entities.Workspace
        {
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            OwnerId = userId.Value,
            CreatedBy = userId.Value.ToString()
        };

        await repo.AddAsync(workspace, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var memberRepo = _unitOfWork.Repository<WorkspaceMember>();
        var ownerMember = new WorkspaceMember
        {
            UserId = userId.Value,
            WorkspaceId = workspace.Id,
            Role = WorkspaceRole.Owner,
            CreatedBy = userId.Value.ToString()
        };
        await memberRepo.AddAsync(ownerMember, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<WorkspaceDto>.SuccessResponse(new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            OwnerId = workspace.OwnerId,
            Plan = workspace.Plan,
            CreatedAt = workspace.CreatedAt,
            MemberCount = 1
        }, "Workspace created successfully.");
    }
}

// --- Update Workspace ---

public class UpdateWorkspaceCommandHandler : IRequestHandler<UpdateWorkspaceCommand, ApiResponse<WorkspaceDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public UpdateWorkspaceCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<WorkspaceDto>> Handle(UpdateWorkspaceCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<WorkspaceDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await repo.GetByIdAsync(request.Id, ct);
        if (workspace == null)
            return ApiResponse<WorkspaceDto>.NotFound("Workspace not found.");

        if (!await WorkspaceAuthorization.HasRole(_unitOfWork, userId.Value, workspace.Id, WorkspaceRole.Editor))
            return ApiResponse<WorkspaceDto>.Failure("You do not have permission to edit this workspace.", System.Net.HttpStatusCode.Forbidden);

        if (request.Name != null) workspace.Name = request.Name;
        if (request.Description != null) workspace.Description = request.Description;
        if (request.IconUrl != null) workspace.IconUrl = request.IconUrl;

        if (!string.IsNullOrEmpty(request.Slug) && request.Slug != workspace.Slug)
        {
            var allWorkspaces = await repo.GetAllAsync(ct);
            if (allWorkspaces.Any(w => w.Slug == request.Slug && w.Id != workspace.Id))
                return ApiResponse<WorkspaceDto>.Failure("A workspace with this slug already exists.");
            workspace.Slug = request.Slug;
        }

        repo.Update(workspace);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<WorkspaceDto>.SuccessResponse(MapHelper.ToDto(workspace), "Workspace updated successfully.");
    }
}

// --- Delete Workspace ---

public class DeleteWorkspaceCommandHandler : IRequestHandler<DeleteWorkspaceCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteWorkspaceCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteWorkspaceCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await repo.GetByIdAsync(request.Id, ct);
        if (workspace == null)
            return ApiResponse<bool>.NotFound("Workspace not found.");

        if (workspace.OwnerId != userId.Value)
            return ApiResponse<bool>.Failure("Only the workspace owner can delete it.", System.Net.HttpStatusCode.Forbidden);

        repo.Delete(workspace);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<bool>.SuccessResponse(true, "Workspace deleted successfully.");
    }
}

// --- Invite Member ---

public class InviteMemberCommandHandler : IRequestHandler<InviteMemberCommand, ApiResponse<WorkspaceMemberDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public InviteMemberCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<WorkspaceMemberDto>> Handle(InviteMemberCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<WorkspaceMemberDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await wsRepo.GetByIdAsync(request.WorkspaceId, ct);
        if (workspace == null)
            return ApiResponse<WorkspaceMemberDto>.NotFound("Workspace not found.");

        if (!await WorkspaceAuthorization.HasRole(_unitOfWork, userId.Value, request.WorkspaceId, WorkspaceRole.Admin))
            return ApiResponse<WorkspaceMemberDto>.Failure("You do not have permission to invite members.", System.Net.HttpStatusCode.Forbidden);

        var targetUser = await _identityService.GetUserInfoByEmailAsync(request.Email);
        if (targetUser == null)
            return ApiResponse<WorkspaceMemberDto>.Failure($"No user found with email {request.Email}.");

        var memberRepo = _unitOfWork.Repository<WorkspaceMember>();
        var allMembers = await memberRepo.GetAllAsync(ct);
        if (allMembers.Any(m => m.UserId == targetUser.Id && m.WorkspaceId == request.WorkspaceId))
            return ApiResponse<WorkspaceMemberDto>.Failure("User is already a member of this workspace.");

        var role = Enum.Parse<WorkspaceRole>(request.Role);
        var member = new WorkspaceMember
        {
            UserId = targetUser.Id,
            WorkspaceId = request.WorkspaceId,
            Role = role,
            CreatedBy = userId.Value.ToString()
        };

        await memberRepo.AddAsync(member, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<WorkspaceMemberDto>.SuccessResponse(new WorkspaceMemberDto
        {
            Id = member.Id,
            UserId = targetUser.Id,
            UserEmail = targetUser.Email,
            UserName = targetUser.FirstName + " " + targetUser.LastName,
            UserAvatarUrl = targetUser.AvatarUrl,
            Role = member.Role.ToString(),
            JoinedAt = member.CreatedAt
        }, "Member invited successfully.");
    }
}

// --- Remove Member ---

public class RemoveMemberCommandHandler : IRequestHandler<RemoveMemberCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public RemoveMemberCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(RemoveMemberCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await wsRepo.GetByIdAsync(request.WorkspaceId, ct);
        if (workspace == null)
            return ApiResponse<bool>.NotFound("Workspace not found.");

        var isAdmin = await WorkspaceAuthorization.HasRole(_unitOfWork, userId.Value, request.WorkspaceId, WorkspaceRole.Admin);
        if (userId.Value != request.UserId && !isAdmin)
            return ApiResponse<bool>.Failure("You do not have permission to remove this member.", System.Net.HttpStatusCode.Forbidden);

        if (request.UserId == workspace.OwnerId)
            return ApiResponse<bool>.Failure("The workspace owner cannot be removed.");

        var memberRepo = _unitOfWork.Repository<WorkspaceMember>();
        var allMembers = await memberRepo.GetAllAsync(ct);
        var member = allMembers.FirstOrDefault(m => m.UserId == request.UserId && m.WorkspaceId == request.WorkspaceId);
        if (member == null)
            return ApiResponse<bool>.Failure("User is not a member of this workspace.");

        memberRepo.Delete(member);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<bool>.SuccessResponse(true, "Member removed successfully.");
    }
}

// --- Update Member Role ---

public class UpdateMemberRoleCommandHandler : IRequestHandler<UpdateMemberRoleCommand, ApiResponse<WorkspaceMemberDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateMemberRoleCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<WorkspaceMemberDto>> Handle(UpdateMemberRoleCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<WorkspaceMemberDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await wsRepo.GetByIdAsync(request.WorkspaceId, ct);
        if (workspace == null)
            return ApiResponse<WorkspaceMemberDto>.NotFound("Workspace not found.");

        if (!await WorkspaceAuthorization.HasRole(_unitOfWork, userId.Value, request.WorkspaceId, WorkspaceRole.Admin))
            return ApiResponse<WorkspaceMemberDto>.Failure("You do not have permission to change roles.", System.Net.HttpStatusCode.Forbidden);

        if (request.UserId == workspace.OwnerId)
            return ApiResponse<WorkspaceMemberDto>.Failure("The owner's role cannot be changed.");

        var memberRepo = _unitOfWork.Repository<WorkspaceMember>();
        var allMembers = await memberRepo.GetAllAsync(ct);
        var member = allMembers.FirstOrDefault(m => m.UserId == request.UserId && m.WorkspaceId == request.WorkspaceId);
        if (member == null)
            return ApiResponse<WorkspaceMemberDto>.Failure("User is not a member of this workspace.");

        var role = Enum.Parse<WorkspaceRole>(request.Role);
        member.Role = role;
        memberRepo.Update(member);
        await _unitOfWork.SaveChangesAsync(ct);

        var userInfo = await _identityService.GetUserInfoAsync(member.UserId);

        return ApiResponse<WorkspaceMemberDto>.SuccessResponse(new WorkspaceMemberDto
        {
            Id = member.Id,
            UserId = member.UserId,
            UserEmail = userInfo?.Email ?? "",
            UserName = userInfo != null ? userInfo.FirstName + " " + userInfo.LastName : "",
            UserAvatarUrl = userInfo?.AvatarUrl,
            Role = member.Role.ToString(),
            JoinedAt = member.CreatedAt
        }, "Role updated successfully.");
    }
}

// --- Helpers ---

internal static class MapHelper
{
    public static WorkspaceDto ToDto(Domain.Entities.Workspace workspace, int memberCount = 0)
    {
        return new WorkspaceDto
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Description = workspace.Description,
            IconUrl = workspace.IconUrl,
            OwnerId = workspace.OwnerId,
            Plan = workspace.Plan,
            CreatedAt = workspace.CreatedAt,
            MemberCount = memberCount
        };
    }
}

internal static class WorkspaceAuthorization
{
    public static async Task<bool> HasRole(IUnitOfWork unitOfWork, Guid userId, Guid workspaceId, WorkspaceRole minimumRole)
    {
        var memberRepo = unitOfWork.Repository<WorkspaceMember>();
        var members = await memberRepo.GetAllAsync();
        var member = members.FirstOrDefault(m => m.UserId == userId && m.WorkspaceId == workspaceId);
        if (member == null) return false;
        return member.Role <= minimumRole;
    }
}
