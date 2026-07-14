using MediatR;
using SyncSpace.Application.Common.Models;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Application.Features.Drive.DTOs;

// --- DTOs ---

public record DriveFileDto
{
    public Guid Id { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string? ThumbnailUrl { get; init; }
    public string MimeType { get; init; } = string.Empty;
    public long Size { get; init; }
    public string FileType { get; init; } = "Other";
    public string? FolderPath { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid UploadedById { get; init; }
    public string UploadedByName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Tags { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record DriveFolderDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Path { get; init; } = "/";
    public string? ParentPath { get; init; }
    public Guid WorkspaceId { get; init; }
    public int FileCount { get; init; }
    public long TotalSize { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record StorageStatsDto
{
    public long TotalSize { get; init; }
    public int TotalFiles { get; init; }
    public int TotalFolders { get; init; }
    public long UsedStorage { get; init; }
    public long FreeStorage { get; init; }
    public Dictionary<string, long> SizeByType { get; init; } = [];
    public Dictionary<string, int> CountByType { get; init; } = [];
    public List<DriveFileDto> RecentFiles { get; init; } = [];
}

public record FilePreviewDto
{
    public DriveFileDto File { get; init; } = null!;
    public string PreviewUrl { get; init; } = string.Empty;
    public bool CanEdit { get; init; }
    public bool CanDelete { get; init; }
}

// --- Commands ---

public record UploadFileCommand : IRequest<ApiResponse<DriveFileDto>>
{
    public Guid WorkspaceId { get; init; }
    public string? FolderPath { get; init; }
    public string? Description { get; init; }
    public string? Tags { get; init; }
    public Stream FileStream { get; init; } = Stream.Null;
    public string Filename { get; init; } = string.Empty;
    public string MimeType { get; init; } = string.Empty;
    public long FileSize { get; init; }
}

public record UpdateFileCommand : IRequest<ApiResponse<DriveFileDto>>
{
    public Guid FileId { get; init; }
    public string? Description { get; init; }
    public string? Tags { get; init; }
    public string? FolderPath { get; init; }
}

public record DeleteFileCommand : IRequest<ApiResponse<bool>>
{
    public Guid FileId { get; init; }
}

public record RestoreFileCommand : IRequest<ApiResponse<DriveFileDto>>
{
    public Guid FileId { get; init; }
}

public record MoveFileCommand : IRequest<ApiResponse<DriveFileDto>>
{
    public Guid FileId { get; init; }
    public string TargetFolderPath { get; init; } = "/";
}

public record CreateFolderCommand : IRequest<ApiResponse<DriveFolderDto>>
{
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? ParentPath { get; init; }
}

public record DeleteFolderCommand : IRequest<ApiResponse<bool>>
{
    public Guid FolderId { get; init; }
    public bool Recursive { get; init; }
}

// --- Queries ---

public record GetWorkspaceFilesQuery : IRequest<ApiResponse<List<DriveFileDto>>>
{
    public Guid WorkspaceId { get; init; }
    public string? FolderPath { get; init; }
    public string? Search { get; init; }
    public string? FileType { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}

public record GetFileQuery : IRequest<ApiResponse<DriveFileDto>>
{
    public Guid FileId { get; init; }
}

public record GetFilePreviewQuery : IRequest<ApiResponse<FilePreviewDto>>
{
    public Guid FileId { get; init; }
}

public record GetWorkspaceFoldersQuery : IRequest<ApiResponse<List<DriveFolderDto>>>
{
    public Guid WorkspaceId { get; init; }
    public string? ParentPath { get; init; }
}

public record GetStorageStatsQuery : IRequest<ApiResponse<StorageStatsDto>>
{
    public Guid WorkspaceId { get; init; }
}

public record GetDeletedFilesQuery : IRequest<ApiResponse<List<DriveFileDto>>>
{
    public Guid WorkspaceId { get; init; }
}
