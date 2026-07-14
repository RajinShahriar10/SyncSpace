using MediatR;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Drive.DTOs;
using SyncSpace.Application.Features.Drive.Commands;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Interfaces;

namespace SyncSpace.Application.Features.Drive.Queries;

public class GetWorkspaceFilesQueryHandler : IRequestHandler<GetWorkspaceFilesQuery, ApiResponse<List<DriveFileDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetWorkspaceFilesQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<DriveFileDto>>> Handle(GetWorkspaceFilesQuery request, CancellationToken ct)
    {
        var files = (await _unitOfWork.Repository<DriveFile>().GetAllAsync(ct))
            .Where(f => f.WorkspaceId == request.WorkspaceId && !f.IsDeleted);

        if (!string.IsNullOrEmpty(request.FolderPath))
            files = files.Where(f => f.FolderPath == $"/{request.FolderPath.Trim('/')}");
        else
            files = files.Where(f => f.FolderPath == "/");

        if (!string.IsNullOrEmpty(request.Search))
            files = files.Where(f => f.OriginalFilename.Contains(request.Search, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(request.FileType) && Enum.TryParse<Domain.Entities.FileType>(request.FileType, true, out var ft))
        {
            files = files.Where(f => f.FileType == ft);
        }

        var paged = files.OrderByDescending(f => f.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = new List<DriveFileDto>();
        foreach (var f in paged)
        {
            var user = await _identityService.GetUserInfoAsync(f.UploadedById);
            dtos.Add(DriveMapper.MapFile(f, user));
        }

        return ApiResponse<List<DriveFileDto>>.SuccessResponse(dtos);
    }
}

public class GetFileQueryHandler : IRequestHandler<GetFileQuery, ApiResponse<DriveFileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetFileQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<DriveFileDto>> Handle(GetFileQuery request, CancellationToken ct)
    {
        var file = await _unitOfWork.Repository<DriveFile>().GetByIdAsync(request.FileId, ct);
        if (file == null || file.IsDeleted) return ApiResponse<DriveFileDto>.NotFound("File not found.");

        var user = await _identityService.GetUserInfoAsync(file.UploadedById);
        return ApiResponse<DriveFileDto>.SuccessResponse(DriveMapper.MapFile(file, user));
    }
}

public class GetFilePreviewQueryHandler : IRequestHandler<GetFilePreviewQuery, ApiResponse<FilePreviewDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;
    private readonly ICloudinaryService _cloudinary;

    public GetFilePreviewQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser, IIdentityService identityService, ICloudinaryService cloudinary)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _identityService = identityService;
        _cloudinary = cloudinary;
    }

    public async Task<ApiResponse<FilePreviewDto>> Handle(GetFilePreviewQuery request, CancellationToken ct)
    {
        var file = await _unitOfWork.Repository<DriveFile>().GetByIdAsync(request.FileId, ct);
        if (file == null || file.IsDeleted) return ApiResponse<FilePreviewDto>.NotFound("File not found.");

        var user = await _identityService.GetUserInfoAsync(file.UploadedById);
        var currentUserId = _currentUser.UserId ?? Guid.Empty;

        var previewUrl = file.FileType == FileType.Image
            ? _cloudinary.GetPreviewUrl(file.StorageFilename, 800, 600)
            : _cloudinary.GetDownloadUrl(file.StorageFilename);

        return ApiResponse<FilePreviewDto>.SuccessResponse(new FilePreviewDto
        {
            File = DriveMapper.MapFile(file, user),
            PreviewUrl = previewUrl,
            CanEdit = file.UploadedById == currentUserId,
            CanDelete = file.UploadedById == currentUserId
        });
    }
}

public class GetWorkspaceFoldersQueryHandler : IRequestHandler<GetWorkspaceFoldersQuery, ApiResponse<List<DriveFolderDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetWorkspaceFoldersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<DriveFolderDto>>> Handle(GetWorkspaceFoldersQuery request, CancellationToken ct)
    {
        var folders = (await _unitOfWork.Repository<DriveFolder>().GetAllAsync(ct))
            .Where(f => f.WorkspaceId == request.WorkspaceId);

        var parentPath = request.ParentPath != null ? $"/{request.ParentPath.Trim('/')}" : "/";
        folders = folders.Where(f => f.ParentPath == parentPath);

        var files = await _unitOfWork.Repository<DriveFile>().GetAllAsync(ct);
        var dtos = folders.OrderByDescending(f => f.Name).Select(f =>
        {
            var folderFiles = files.Where(fi => fi.FolderPath == f.Path && !fi.IsDeleted).ToList();
            return new DriveFolderDto
            {
                Id = f.Id,
                Name = f.Name,
                Path = f.Path,
                ParentPath = f.ParentPath,
                WorkspaceId = f.WorkspaceId,
                FileCount = folderFiles.Count,
                TotalSize = folderFiles.Sum(fi => fi.Size),
                CreatedAt = f.CreatedAt
            };
        }).ToList();

        return ApiResponse<List<DriveFolderDto>>.SuccessResponse(dtos);
    }
}

public class GetStorageStatsQueryHandler : IRequestHandler<GetStorageStatsQuery, ApiResponse<StorageStatsDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;
    private readonly ICloudinaryService _cloudinary;

    public GetStorageStatsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService, ICloudinaryService cloudinary)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
        _cloudinary = cloudinary;
    }

    public async Task<ApiResponse<StorageStatsDto>> Handle(GetStorageStatsQuery request, CancellationToken ct)
    {
        var files = (await _unitOfWork.Repository<DriveFile>().GetAllAsync(ct))
            .Where(f => f.WorkspaceId == request.WorkspaceId && !f.IsDeleted).ToList();
        var folders = (await _unitOfWork.Repository<DriveFolder>().GetAllAsync(ct))
            .Where(f => f.WorkspaceId == request.WorkspaceId).ToList();

        var totalSize = files.Sum(f => f.Size);
        var maxSize = 10L * 1024 * 1024 * 1024; // 10 GB

        var sizeByType = files.GroupBy(f => f.FileType.ToString())
            .ToDictionary(g => g.Key, g => g.Sum(f => f.Size));
        var countByType = files.GroupBy(f => f.FileType.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var recentFiles = files.OrderByDescending(f => f.CreatedAt).Take(10).ToList();
        var recentDtos = new List<DriveFileDto>();
        foreach (var f in recentFiles)
        {
            var user = await _identityService.GetUserInfoAsync(f.UploadedById);
            recentDtos.Add(DriveMapper.MapFile(f, user));
        }

        return ApiResponse<StorageStatsDto>.SuccessResponse(new StorageStatsDto
        {
            TotalSize = totalSize,
            TotalFiles = files.Count,
            TotalFolders = folders.Count,
            UsedStorage = totalSize,
            FreeStorage = Math.Max(0, maxSize - totalSize),
            SizeByType = sizeByType,
            CountByType = countByType,
            RecentFiles = recentDtos
        });
    }
}

public class GetDeletedFilesQueryHandler : IRequestHandler<GetDeletedFilesQuery, ApiResponse<List<DriveFileDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIdentityService _identityService;

    public GetDeletedFilesQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    {
        _unitOfWork = unitOfWork;
        _identityService = identityService;
    }

    public async Task<ApiResponse<List<DriveFileDto>>> Handle(GetDeletedFilesQuery request, CancellationToken ct)
    {
        var files = (await _unitOfWork.Repository<DriveFile>().GetAllAsync(ct))
            .Where(f => f.WorkspaceId == request.WorkspaceId && f.IsDeleted)
            .OrderByDescending(f => f.DeletedAt)
            .ToList();

        var dtos = new List<DriveFileDto>();
        foreach (var f in files)
        {
            var user = await _identityService.GetUserInfoAsync(f.UploadedById);
            dtos.Add(DriveMapper.MapFile(f, user));
        }

        return ApiResponse<List<DriveFileDto>>.SuccessResponse(dtos);
    }
}
