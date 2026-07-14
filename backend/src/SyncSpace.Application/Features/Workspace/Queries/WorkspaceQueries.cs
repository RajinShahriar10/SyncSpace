using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Workspace.DTOs;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Workspace.Queries;

public class GetWorkspaceQueryHandler : IRequestHandler<GetWorkspaceQuery, ApiResponse<WorkspaceDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetWorkspaceQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<WorkspaceDto>> Handle(GetWorkspaceQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<WorkspaceDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await wsRepo.GetByIdAsync(request.Id, ct);
        if (workspace == null)
            return ApiResponse<WorkspaceDto>.NotFound("Workspace not found.");

        var memberRepo = _unitOfWork.Repository<Domain.Entities.WorkspaceMember>();
        var members = await memberRepo.GetAllAsync(ct);
        var memberCount = members.Count(m => m.WorkspaceId == workspace.Id);

        var dto = Commands.MapHelper.ToDto(workspace, memberCount);

        return ApiResponse<WorkspaceDto>.SuccessResponse(dto);
    }
}

public class GetUserWorkspacesQueryHandler : IRequestHandler<GetUserWorkspacesQuery, ApiResponse<List<WorkspaceDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetUserWorkspacesQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<List<WorkspaceDto>>> Handle(GetUserWorkspacesQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<List<WorkspaceDto>>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var memberRepo = _unitOfWork.Repository<Domain.Entities.WorkspaceMember>();
        var members = await memberRepo.GetAllAsync(ct);
        var userWorkspaceIds = members
            .Where(m => m.UserId == userId.Value)
            .Select(m => m.WorkspaceId)
            .ToList();

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var allWorkspaces = await wsRepo.GetAllAsync(ct);
        var workspaces = allWorkspaces.Where(w => userWorkspaceIds.Contains(w.Id)).ToList();

        var dtos = workspaces.Select(w =>
        {
            var wsMemberCount = members.Count(m => m.WorkspaceId == w.Id);
            return Commands.MapHelper.ToDto(w, wsMemberCount);
        }).ToList();

        return ApiResponse<List<WorkspaceDto>>.SuccessResponse(dtos);
    }
}

public class GetWorkspaceMembersQueryHandler : IRequestHandler<GetWorkspaceMembersQuery, ApiResponse<List<WorkspaceMemberDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public GetWorkspaceMembersQueryHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<WorkspaceMemberDto>>> Handle(GetWorkspaceMembersQuery request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<List<WorkspaceMemberDto>>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var wsRepo = _unitOfWork.Repository<Domain.Entities.Workspace>();
        var workspace = await wsRepo.GetByIdAsync(request.WorkspaceId, ct);
        if (workspace == null)
            return ApiResponse<List<WorkspaceMemberDto>>.NotFound("Workspace not found.");

        var memberRepo = _unitOfWork.Repository<Domain.Entities.WorkspaceMember>();
        var allMembers = await memberRepo.GetAllAsync(ct);
        var workspaceMembers = allMembers.Where(m => m.WorkspaceId == request.WorkspaceId).ToList();

        var dtos = new List<WorkspaceMemberDto>();
        foreach (var member in workspaceMembers)
        {
            var userInfo = await _identityService.GetUserInfoAsync(member.UserId);
            dtos.Add(new WorkspaceMemberDto
            {
                Id = member.Id,
                UserId = member.UserId,
                UserEmail = userInfo?.Email ?? "",
                UserName = userInfo != null ? userInfo.FirstName + " " + userInfo.LastName : "Unknown",
                UserAvatarUrl = userInfo?.AvatarUrl,
                Role = member.Role.ToString(),
                JoinedAt = member.CreatedAt
            });
        }

        return ApiResponse<List<WorkspaceMemberDto>>.SuccessResponse(dtos);
    }
}
