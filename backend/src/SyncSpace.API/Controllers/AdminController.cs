using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Admin.DTOs;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    // ===================== OVERVIEW =====================
    [HttpGet("overview")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOverview(CancellationToken ct)
    {
        var result = await _admin.GetOverviewAsync(ct);
        return Ok(new { success = true, data = result });
    }

    // ===================== USERS =====================
    [HttpGet("users")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _admin.GetUsersAsync(search, page, pageSize, ct);
        return Ok(new { success = true, data = result.Items, pagination = new { result.Page, result.PageSize, result.TotalCount, result.TotalPages } });
    }

    [HttpGet("users/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(Guid id, CancellationToken ct)
    {
        var result = await _admin.GetUserByIdAsync(id, ct);
        return result == null ? NotFound() : Ok(new { success = true, data = result });
    }

    [HttpPut("users")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        await _admin.UpdateUserAsync(request, ct);
        return Ok(new { success = true, message = "User updated" });
    }

    [HttpDelete("users/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await _admin.DeleteUserAsync(id, ct);
        return Ok(new { success = true, message = "User deleted" });
    }

    // ===================== WORKSPACES =====================
    [HttpGet("workspaces")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspaces([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _admin.GetWorkspacesAsync(search, page, pageSize, ct);
        return Ok(new { success = true, data = result.Items, pagination = new { result.Page, result.PageSize, result.TotalCount, result.TotalPages } });
    }

    [HttpGet("workspaces/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspace(Guid id, CancellationToken ct)
    {
        var result = await _admin.GetWorkspaceByIdAsync(id, ct);
        return result == null ? NotFound() : Ok(new { success = true, data = result });
    }

    [HttpPut("workspaces")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateWorkspace([FromBody] UpdateWorkspaceRequest request, CancellationToken ct)
    {
        await _admin.UpdateWorkspaceAsync(request, ct);
        return Ok(new { success = true, message = "Workspace updated" });
    }

    [HttpDelete("workspaces/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteWorkspace(Guid id, CancellationToken ct)
    {
        await _admin.DeleteWorkspaceAsync(id, ct);
        return Ok(new { success = true, message = "Workspace deleted" });
    }

    // ===================== DOCUMENTS =====================
    [HttpGet("documents")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments([FromQuery] Guid? workspaceId, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _admin.GetDocumentsAsync(workspaceId, search, page, pageSize, ct);
        return Ok(new { success = true, data = result.Items, pagination = new { result.Page, result.PageSize, result.TotalCount, result.TotalPages } });
    }

    [HttpGet("documents/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken ct)
    {
        var result = await _admin.GetDocumentByIdAsync(id, ct);
        return result == null ? NotFound() : Ok(new { success = true, data = result });
    }

    [HttpDelete("documents/{id:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken ct)
    {
        await _admin.DeleteDocumentAsync(id, ct);
        return Ok(new { success = true, message = "Document deleted" });
    }

    // ===================== STORAGE =====================
    [HttpGet("storage")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStorage(CancellationToken ct)
    {
        var result = await _admin.GetStorageOverviewAsync(ct);
        return Ok(new { success = true, data = result });
    }

    // ===================== SYSTEM HEALTH =====================
    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemHealth(CancellationToken ct)
    {
        var result = await _admin.GetSystemHealthAsync(ct);
        return Ok(new { success = true, data = result });
    }

    // ===================== AUDIT LOGS =====================
    [HttpGet("audit")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? action, [FromQuery] Guid? userId, [FromQuery] Guid? workspaceId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken ct = default)
    {
        var result = await _admin.GetAuditLogsAsync(action, userId, workspaceId, page, pageSize, ct);
        return Ok(new { success = true, data = result.Items, pagination = new { result.Page, result.PageSize, result.TotalCount, result.TotalPages } });
    }
}
