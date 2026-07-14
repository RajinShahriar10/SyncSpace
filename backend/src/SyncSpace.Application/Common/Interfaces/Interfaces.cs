using System.Security.Claims;
using SyncSpace.Application.Features.Auth.DTOs;

namespace SyncSpace.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}

public interface IJwtTokenService
{
    Task<AuthTokens> GenerateTokensAsync(Guid userId, string email, string firstName, string lastName, IList<string> roles);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

public class AuthTokens
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiry { get; set; }
}

public interface IIdentityService
{
    Task<(bool Success, string[] Errors)> CreateUserAsync(
        Guid userId, string email, string password, string firstName, string lastName);
    Task<(bool Success, string[] Errors)> CreateUserWithoutPasswordAsync(
        Guid userId, string email, string firstName, string lastName, string? avatarUrl);
    Task<(bool Success, string[] Errors)> AddToRoleAsync(Guid userId, string role);
    Task<(bool Success, string Error)> CheckPasswordAsync(string email, string password);
    Task<IList<string>> GetRolesAsync(Guid userId);
    Task<UserInfo?> GetUserInfoAsync(Guid userId);
    Task<UserInfo?> GetUserInfoByEmailAsync(string email);
    Task<DateTime?> GetLockoutEndAsync(Guid userId);
    Task<int> GetFailedLoginAttemptsAsync(Guid userId);
    Task<bool> IsUserActiveAsync(Guid userId);
    Task<bool> LockoutUserAsync(Guid userId, TimeSpan duration);
    Task<bool> ResetFailedAttemptsAsync(Guid userId);
    Task<bool> IncrementFailedAttemptsAsync(Guid userId);
    Task<bool> SetLastLoginAsync(Guid userId);
    Task<bool> DeactivateUserAsync(Guid userId);
}

public class UserInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public interface IRefreshTokenService
{
    Task<Domain.Entities.RefreshToken?> GetActiveTokenAsync(string token, Guid userId);
    Task SaveTokenAsync(Domain.Entities.RefreshToken refreshToken);
    Task RevokeTokenAsync(Domain.Entities.RefreshToken refreshToken, string? replacedByToken = null);
}

public interface IGoogleAuthService
{
    Task<ExternalUserInfo?> ValidateTokenAsync(string idToken);
}

public interface IGithubAuthService
{
    Task<ExternalUserInfo?> GetUserInfoAsync(string accessToken);
}

public class ExternalUserInfo
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Picture { get; set; }
    public string? ExternalId { get; set; }
}

public interface ICloudinaryService
{
    Task<CloudinaryUploadResult> UploadFileAsync(Stream fileStream, string filename, string folder, CancellationToken ct = default);
    Task<CloudinaryUploadResult> UploadImageAsync(Stream fileStream, string filename, string folder, int? maxWidth = null, int? maxHeight = null, CancellationToken ct = default);
    Task<bool> DeleteFileAsync(string publicId, CancellationToken ct = default);
    string GetDownloadUrl(string publicId);
    string GetPreviewUrl(string publicId, int? width = null, int? height = null);
    string GetThumbnailUrl(string publicId, int size = 200);
    Task<long> GetStorageUsageAsync(Guid workspaceId, CancellationToken ct = default);
}

public class CloudinaryUploadResult
{
    public bool Success { get; set; }
    public string PublicId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string Format { get; set; } = string.Empty;
    public long Size { get; set; }
    public string? Error { get; set; }
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}
