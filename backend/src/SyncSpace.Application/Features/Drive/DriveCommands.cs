using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Drive.DTOs;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Drive.Commands;

// --- Upload ---

public class UploadFileCommandHandler : IRequestHandler<UploadFileCommand, ApiResponse<DriveFileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ICloudinaryService _cloudinary;
    private readonly IIdentityService _identityService;

    public UploadFileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, ICloudinaryService cloudinary, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _cloudinary = cloudinary;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DriveFileDto>> Handle(UploadFileCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DriveFileDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var isImage = request.MimeType.StartsWith("image/");
        var folder = $"workspace_{request.WorkspaceId}/{request.FolderPath?.Trim('/') ?? "root"}";

        CloudinaryUploadResult uploadResult;
        if (isImage)
            uploadResult = await _cloudinary.UploadImageAsync(request.FileStream, request.Filename, folder, ct: ct);
        else
            uploadResult = await _cloudinary.UploadFileAsync(request.FileStream, request.Filename, folder, ct);

        if (!uploadResult.Success)
            return ApiResponse<DriveFileDto>.Failure($"Upload failed: {uploadResult.Error}");

        var fileType = DriveFileTypeHelper.DetermineFileType(request.MimeType);

        var driveFile = new DriveFile
        {
            OriginalFilename = request.Filename,
            StorageFilename = uploadResult.PublicId,
            Url = uploadResult.Url,
            ThumbnailUrl = uploadResult.ThumbnailUrl,
            MimeType = request.MimeType,
            Size = request.FileSize > 0 ? request.FileSize : uploadResult.Size,
            FileType = fileType,
            FolderPath = $"/{request.FolderPath?.Trim('/') ?? ""}",
            WorkspaceId = request.WorkspaceId,
            UploadedById = userId.Value,
            Description = request.Description,
            Tags = request.Tags,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<DriveFile>().AddAsync(driveFile, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DriveFileDto>.SuccessResponse(DriveMapper.MapFile(driveFile, user));
    }
}

// --- Update ---

public class UpdateFileCommandHandler : IRequestHandler<UpdateFileCommand, ApiResponse<DriveFileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateFileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DriveFileDto>> Handle(UpdateFileCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DriveFileDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DriveFile>();
        var file = await repo.GetByIdAsync(request.FileId, ct);
        if (file == null) return ApiResponse<DriveFileDto>.NotFound("File not found.");
        if (file.UploadedById != userId.Value) return ApiResponse<DriveFileDto>.Failure("Only the uploader can edit file details.");

        if (request.Description != null) file.Description = request.Description;
        if (request.Tags != null) file.Tags = request.Tags;
        if (request.FolderPath != null) file.FolderPath = $"/{request.FolderPath.Trim('/')}";
        repo.Update(file);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DriveFileDto>.SuccessResponse(DriveMapper.MapFile(file, user));
    }
}

// --- Delete (soft) ---

public class DeleteFileCommandHandler : IRequestHandler<DeleteFileCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly ICloudinaryService _cloudinary;

    public DeleteFileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, ICloudinaryService cloudinary)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _cloudinary = cloudinary;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteFileCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DriveFile>();
        var file = await repo.GetByIdAsync(request.FileId, ct);
        if (file == null) return ApiResponse<bool>.NotFound("File not found.");

        file.IsDeleted = true;
        file.DeletedAt = DateTime.UtcNow;
        repo.Update(file);
        await _unitOfWork.SaveChangesAsync(ct);

        // Delete from Cloudinary asynchronously (fire and forget)
        _ = _cloudinary.DeleteFileAsync(file.StorageFilename);

        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Restore ---

public class RestoreFileCommandHandler : IRequestHandler<RestoreFileCommand, ApiResponse<DriveFileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public RestoreFileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DriveFileDto>> Handle(RestoreFileCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DriveFileDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DriveFile>();
        var file = await repo.GetByIdAsync(request.FileId, ct);
        if (file == null || !file.IsDeleted) return ApiResponse<DriveFileDto>.NotFound("File not found in trash.");

        file.IsDeleted = false;
        file.DeletedAt = null;
        repo.Update(file);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DriveFileDto>.SuccessResponse(DriveMapper.MapFile(file, user));
    }
}

// --- Move ---

public class MoveFileCommandHandler : IRequestHandler<MoveFileCommand, ApiResponse<DriveFileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public MoveFileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DriveFileDto>> Handle(MoveFileCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DriveFileDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DriveFile>();
        var file = await repo.GetByIdAsync(request.FileId, ct);
        if (file == null) return ApiResponse<DriveFileDto>.NotFound("File not found.");

        file.FolderPath = $"/{request.TargetFolderPath.Trim('/')}";
        repo.Update(file);
        await _unitOfWork.SaveChangesAsync(ct);

        var user = await _identityService.GetUserInfoAsync(userId.Value);
        return ApiResponse<DriveFileDto>.SuccessResponse(DriveMapper.MapFile(file, user));
    }
}

// --- Create Folder ---

public class CreateFolderCommandHandler : IRequestHandler<CreateFolderCommand, ApiResponse<DriveFolderDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public CreateFolderCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<DriveFolderDto>> Handle(CreateFolderCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<DriveFolderDto>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var parentPath = $"/{request.ParentPath?.Trim('/') ?? ""}";
        var folderPath = $"{parentPath}{request.Name}/";

        var existing = (await _unitOfWork.Repository<DriveFolder>().GetAllAsync(ct))
            .Any(f => f.WorkspaceId == request.WorkspaceId && f.Path == folderPath);
        if (existing) return ApiResponse<DriveFolderDto>.Failure("Folder already exists.");

        var folder = new DriveFolder
        {
            Name = request.Name,
            Path = folderPath,
            ParentPath = parentPath,
            WorkspaceId = request.WorkspaceId,
            CreatedById = userId.Value,
            CreatedBy = userId.Value.ToString()
        };

        await _unitOfWork.Repository<DriveFolder>().AddAsync(folder, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ApiResponse<DriveFolderDto>.SuccessResponse(new DriveFolderDto
        {
            Id = folder.Id,
            Name = folder.Name,
            Path = folder.Path,
            ParentPath = folder.ParentPath,
            WorkspaceId = folder.WorkspaceId,
            CreatedAt = folder.CreatedAt
        });
    }
}

// --- Delete Folder ---

public class DeleteFolderCommandHandler : IRequestHandler<DeleteFolderCommand, ApiResponse<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public DeleteFolderCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteFolderCommand request, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (userId == null) return ApiResponse<bool>.Failure("Unauthorized.", System.Net.HttpStatusCode.Unauthorized);

        var repo = _unitOfWork.Repository<DriveFolder>();
        var folder = await repo.GetByIdAsync(request.FolderId, ct);
        if (folder == null) return ApiResponse<bool>.NotFound("Folder not found.");

        if (request.Recursive)
        {
            var subFolders = (await repo.GetAllAsync(ct)).Where(f => f.Path.StartsWith(folder.Path) && f.Id != folder.Id);
            foreach (var sub in subFolders) repo.Delete(sub);

            var fileRepo = _unitOfWork.Repository<DriveFile>();
            var files = (await fileRepo.GetAllAsync(ct)).Where(f => f.FolderPath != null && f.FolderPath.StartsWith(folder.Path));
            foreach (var f in files) { f.IsDeleted = true; f.DeletedAt = DateTime.UtcNow; fileRepo.Update(f); }
        }
        else
        {
            var hasFiles = (await _unitOfWork.Repository<DriveFile>().GetAllAsync(ct))
                .Any(f => f.FolderPath == folder.Path && !f.IsDeleted);
            if (hasFiles) return ApiResponse<bool>.Failure("Folder is not empty. Use recursive delete.");

            var hasSubFolders = (await repo.GetAllAsync(ct))
                .Any(f => f.ParentPath == folder.Path);
            if (hasSubFolders) return ApiResponse<bool>.Failure("Folder contains subfolders. Use recursive delete.");
        }

        repo.Delete(folder);
        await _unitOfWork.SaveChangesAsync(ct);
        return ApiResponse<bool>.SuccessResponse(true);
    }
}

// --- Helpers ---

internal static class DriveMapper
{
    public static DriveFileDto MapFile(DriveFile file, Application.Common.Interfaces.UserInfo? user)
    {
        return new DriveFileDto
        {
            Id = file.Id,
            Filename = file.OriginalFilename,
            Url = file.Url,
            ThumbnailUrl = file.ThumbnailUrl,
            MimeType = file.MimeType,
            Size = file.Size,
            FileType = file.FileType.ToString(),
            FolderPath = file.FolderPath,
            WorkspaceId = file.WorkspaceId,
            UploadedById = file.UploadedById,
            UploadedByName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            Description = file.Description,
            Tags = file.Tags,
            CreatedAt = file.CreatedAt
        };
    }
}

internal static class DriveFileTypeHelper
{
    public static FileType DetermineFileType(string mimeType)
    {
        return mimeType.ToLowerInvariant() switch
        {
            var m when m.StartsWith("image/") => FileType.Image,
            "application/pdf" => FileType.Pdf,
            var m when m.Contains("word") || m.Contains("document") => FileType.Document,
            var m when m.Contains("sheet") || m.Contains("excel") => FileType.Spreadsheet,
            var m when m.Contains("presentation") || m.Contains("powerpoint") => FileType.Presentation,
            var m when m.StartsWith("video/") => FileType.Video,
            var m when m.StartsWith("audio/") => FileType.Audio,
            var m when m.Contains("zip") || m.Contains("rar") || m.Contains("tar") || m.Contains("gzip") => FileType.Archive,
            _ => FileType.Other
        };
    }
}
