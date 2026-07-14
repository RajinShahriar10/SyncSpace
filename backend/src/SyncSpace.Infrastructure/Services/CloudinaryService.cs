using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using SyncSpace.Application.Common.Interfaces;

namespace SyncSpace.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly string _workspaceFolder;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"] ?? "";
        var apiKey = configuration["Cloudinary:ApiKey"] ?? "";
        var apiSecret = configuration["Cloudinary:ApiSecret"] ?? "";

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _workspaceFolder = configuration["Cloudinary:Folder"] ?? "SyncSpace";
    }

    public async Task<CloudinaryUploadResult> UploadFileAsync(Stream fileStream, string filename, string folder, CancellationToken ct = default)
    {
        try
        {
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(filename, fileStream),
                Folder = $"{_workspaceFolder}/{folder}",
                PublicId = $"{Guid.NewGuid():N}_{SanitizeFilename(filename)}",
                Overwrite = false
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                return new CloudinaryUploadResult { Success = false, Error = result.Error.Message };

            return new CloudinaryUploadResult
            {
                Success = true,
                PublicId = result.PublicId,
                Url = result.SecureUrl?.ToString() ?? result.Uri?.ToString() ?? "",
                Format = result.Format ?? "",
                Size = result.Bytes
            };
        }
        catch (Exception ex)
        {
            return new CloudinaryUploadResult { Success = false, Error = ex.Message };
        }
    }

    public async Task<CloudinaryUploadResult> UploadImageAsync(Stream fileStream, string filename, string folder, int? maxWidth = null, int? maxHeight = null, CancellationToken ct = default)
    {
        try
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(filename, fileStream),
                Folder = $"{_workspaceFolder}/{folder}",
                PublicId = $"{Guid.NewGuid():N}_{SanitizeFilename(Path.GetFileNameWithoutExtension(filename))}",
                Overwrite = false,
                Transformation = BuildTransformation(maxWidth, maxHeight)
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                return new CloudinaryUploadResult { Success = false, Error = result.Error.Message };

            var thumbUrl = _cloudinary.Api.UrlImgUp
                .Transform(new Transformation().Width(200).Height(200).Crop("fill"))
                .BuildUrl(result.PublicId);

            return new CloudinaryUploadResult
            {
                Success = true,
                PublicId = result.PublicId,
                Url = result.SecureUrl?.ToString() ?? "",
                ThumbnailUrl = thumbUrl,
                Format = result.Format ?? "",
                Size = result.Bytes
            };
        }
        catch (Exception ex)
        {
            return new CloudinaryUploadResult { Success = false, Error = ex.Message };
        }
    }

    public async Task<bool> DeleteFileAsync(string publicId, CancellationToken ct = default)
    {
        try
        {
            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
            return result.Result == "ok";
        }
        catch
        {
            return false;
        }
    }

    public string GetDownloadUrl(string publicId)
    {
        return _cloudinary.Api.UrlImgUp.BuildUrl(publicId);
    }

    public string GetPreviewUrl(string publicId, int? width = null, int? height = null)
    {
        var transformation = new Transformation();
        if (width.HasValue) transformation.Width(width.Value);
        if (height.HasValue) transformation.Height(height.Value);
        transformation.Crop("limit");
        return _cloudinary.Api.UrlImgUp.Transform(transformation).BuildUrl(publicId);
    }

    public string GetThumbnailUrl(string publicId, int size = 200)
    {
        return _cloudinary.Api.UrlImgUp
            .Transform(new Transformation().Width(size).Height(size).Crop("fill").Gravity("auto"))
            .BuildUrl(publicId);
    }

    public Task<long> GetStorageUsageAsync(Guid workspaceId, CancellationToken ct = default)
    {
        // In production, query DB for total sizes. This returns 0 as placeholder.
        return Task.FromResult(0L);
    }

    private static Transformation? BuildTransformation(int? maxWidth, int? maxHeight)
    {
        if (!maxWidth.HasValue && !maxHeight.HasValue) return null;
        var t = new Transformation();
        if (maxWidth.HasValue && maxHeight.HasValue)
            t = t.Width(maxWidth.Value).Height(maxHeight.Value).Crop("limit");
        else if (maxWidth.HasValue)
            t = t.Width(maxWidth.Value).Crop("scale");
        else if (maxHeight.HasValue)
            t = t.Height(maxHeight.Value).Crop("scale");
        return t;
    }

    private static string SanitizeFilename(string filename)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var clean = new string(filename.Where(c => !invalid.Contains(c)).ToArray());
        return clean.Replace(" ", "_").ToLowerInvariant();
    }
}
