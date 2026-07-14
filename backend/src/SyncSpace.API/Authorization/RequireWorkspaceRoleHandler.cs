using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.API.Authorization;

public class RequireWorkspaceRoleHandler : AuthorizationHandler<RequireWorkspaceRoleRequirement>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public RequireWorkspaceRoleHandler(ICurrentUserService currentUser, IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        RequireWorkspaceRoleRequirement requirement)
    {
        if (_currentUser.UserId == null)
        {
            context.Fail();
            return;
        }

        if (context.Resource is not FilterContext filterContext)
        {
            context.Fail();
            return;
        }

        if (!filterContext.HttpContext.Request.RouteValues.TryGetValue("workspaceId", out var wsIdObj) ||
            wsIdObj == null || !Guid.TryParse(wsIdObj.ToString(), out var workspaceId))
        {
            context.Fail();
            return;
        }

        var memberRepo = _unitOfWork.Repository<Domain.Entities.WorkspaceMember>();
        var members = await memberRepo.GetAllAsync();
        var member = members.FirstOrDefault(m =>
            m.UserId == _currentUser.UserId.Value && m.WorkspaceId == workspaceId);

        if (member == null)
        {
            context.Fail();
            return;
        }

        if (member.Role <= requirement.MinimumRole)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }
}

public class RequireWorkspaceRoleRequirement : IAuthorizationRequirement
{
    public WorkspaceRole MinimumRole { get; }

    public RequireWorkspaceRoleRequirement(WorkspaceRole minimumRole)
    {
        MinimumRole = minimumRole;
    }
}

public static class WorkspaceAuthorizationPolicy
{
    public const string Owner = "WorkspaceOwner";
    public const string Admin = "WorkspaceAdmin";
    public const string Editor = "WorkspaceEditor";
    public const string Viewer = "WorkspaceViewer";

    public static void AddWorkspacePolicies(AuthorizationOptions options)
    {
        options.AddPolicy(Owner, policy =>
            policy.Requirements.Add(new RequireWorkspaceRoleRequirement(WorkspaceRole.Owner)));

        options.AddPolicy(Admin, policy =>
            policy.Requirements.Add(new RequireWorkspaceRoleRequirement(WorkspaceRole.Admin)));

        options.AddPolicy(Editor, policy =>
            policy.Requirements.Add(new RequireWorkspaceRoleRequirement(WorkspaceRole.Editor)));

        options.AddPolicy(Viewer, policy =>
            policy.Requirements.Add(new RequireWorkspaceRoleRequirement(WorkspaceRole.Viewer)));
    }
}
