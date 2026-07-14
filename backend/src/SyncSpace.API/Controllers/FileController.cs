using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Drive.DTOs;
using SyncSpace.Application.Features.Drive.Commands;
using SyncSpace.Application.Features.Drive.Queries;
using SyncSpace.Domain.Enums;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuditService _auditService;

    public FileController(IMediator mediator, IAuditService auditService)
    {
        _mediator = mediator;
        _auditService = auditService;
    }

    // --- Upload ---

    [HttpPost("upload")]
    [ProducesResponseType(typeof(ApiResponse<DriveFileDto>), StatusCodes.Status201Created)]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromQuery] Guid workspaceId, [FromQuery] string? folderPath, [FromQuery] string? description, [FromQuery] string? tags)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<DriveFileDto>.Failure("No file provided."));

        using var stream = file.OpenReadStream();
        var result = await _mediator.Send(new UploadFileCommand
        {
            WorkspaceId = workspaceId,
            FolderPath = folderPath,
            Description = description,
            Tags = tags,
            FileStream = stream,
            Filename = file.FileName,
            MimeType = file.ContentType,
            FileSize = file.Length
        });

        if (result.Success && result.Data != null)
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            await _auditService.LogAsync(
                userId, AuditAction.FileUploaded, "DriveFile", result.Data.Id, workspaceId,
                "Uploaded file: " + file.FileName);
        }

        return result.Success
            ? CreatedAtAction(nameof(GetFile), new { fileId = result.Data!.Id }, result)
            : BadRequest(result);
    }

    // --- CRUD ---

    [HttpGet("workspace/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<DriveFileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspaceFiles(
        Guid workspaceId,
        [FromQuery] string? folderPath,
        [FromQuery] string? search,
        [FromQuery] string? fileType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _mediator.Send(new GetWorkspaceFilesQuery
        {
            WorkspaceId = workspaceId,
            FolderPath = folderPath,
            Search = search,
            FileType = fileType,
            Page = page,
            PageSize = pageSize
        });
        return Ok(result);
    }

    [HttpGet("{fileId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DriveFileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFile(Guid fileId)
    {
        var result = await _mediator.Send(new GetFileQuery { FileId = fileId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{fileId:guid}/preview")]
    [ProducesResponseType(typeof(ApiResponse<FilePreviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilePreview(Guid fileId)
    {
        var result = await _mediator.Send(new GetFilePreviewQuery { FileId = fileId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPut("{fileId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DriveFileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateFile(Guid fileId, [FromBody] UpdateFileCommand command)
    {
        var result = await _mediator.Send(command with { FileId = fileId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{fileId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteFile(Guid fileId)
    {
        var result = await _mediator.Send(new DeleteFileCommand { FileId = fileId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("{fileId:guid}/restore")]
    [ProducesResponseType(typeof(ApiResponse<DriveFileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RestoreFile(Guid fileId)
    {
        var result = await _mediator.Send(new RestoreFileCommand { FileId = fileId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("{fileId:guid}/move")]
    [ProducesResponseType(typeof(ApiResponse<DriveFileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MoveFile(Guid fileId, [FromQuery] string targetFolderPath)
    {
        var result = await _mediator.Send(new MoveFileCommand { FileId = fileId, TargetFolderPath = targetFolderPath });
        return result.Success ? Ok(result) : NotFound(result);
    }

    // --- Folders ---

    [HttpGet("folders/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<DriveFolderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspaceFolders(Guid workspaceId, [FromQuery] string? parentPath)
    {
        var result = await _mediator.Send(new GetWorkspaceFoldersQuery { WorkspaceId = workspaceId, ParentPath = parentPath });
        return Ok(result);
    }

    [HttpPost("folders")]
    [ProducesResponseType(typeof(ApiResponse<DriveFolderDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success
            ? CreatedAtAction(nameof(GetWorkspaceFolders), new { workspaceId = command.WorkspaceId }, result)
            : BadRequest(result);
    }

    [HttpDelete("folders/{folderId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteFolder(Guid folderId, [FromQuery] bool recursive = false)
    {
        var result = await _mediator.Send(new DeleteFolderCommand { FolderId = folderId, Recursive = recursive });
        return result.Success ? Ok(result) : NotFound(result);
    }

    // --- Stats & Trash ---

    [HttpGet("stats/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<StorageStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStorageStats(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetStorageStatsQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }

    [HttpGet("trash/{workspaceId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<DriveFileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeletedFiles(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetDeletedFilesQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }
}
