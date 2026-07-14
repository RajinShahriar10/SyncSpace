using FluentValidation;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using SyncSpace.API.Authorization;
using SyncSpace.API.Controllers;
using SyncSpace.Application.Common.Behaviours;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Domain.Common;
using SyncSpace.Domain.Interfaces;
using SyncSpace.Infrastructure.Identity;
using SyncSpace.Infrastructure.Services;
using SyncSpace.Persistence.Context;
using SyncSpace.Persistence.Repositories;

namespace SyncSpace.Infrastructure.IntegrationTests;

public class TestWebApplicationFactory
{
    public static readonly Guid TestUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public const string TestJwtKey = "TestKeyThatIsLongEnoughForHmacSha256!!TestKeyThatIsLongEnoughForHmacSha256!!";
    public const string TestJwtIssuer = "TestIssuer";
    public const string TestJwtAudience = "TestAudience";

    private readonly IHost _host;

    public TestWebApplicationFactory()
    {
        _host = Host.CreateDefaultBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices((context, services) =>
                {
                    // AddDbContext with InMemory, then override with TestSyncSpaceDbContext
                    services.AddDbContext<SyncSpaceDbContext>(options =>
                        options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid().ToString()));
                    services.AddScoped<SyncSpaceDbContext>(sp =>
                    {
                        var options = sp.GetRequiredService<DbContextOptions<SyncSpaceDbContext>>();
                        return new TestSyncSpaceDbContext(options);
                    });

                    // Repositories
                    services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
                    services.AddScoped<IUnitOfWork, UnitOfWork>();

                    // Authentication
                    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                        .AddJwtBearer(options =>
                        {
                            options.TokenValidationParameters = new TokenValidationParameters
                            {
                                ValidateIssuer = true,
                                ValidateAudience = true,
                                ValidateIssuerSigningKey = true,
                                ValidIssuer = TestJwtIssuer,
                                ValidAudience = TestJwtAudience,
                                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey)),
                                ValidateLifetime = true,
                                ClockSkew = TimeSpan.FromMinutes(1)
                            };
                        });
                    services.AddAuthorization();

                    // RBAC
                    services.AddScoped<IAuthorizationHandler, RequireWorkspaceRoleHandler>();
                    services.AddAuthorization(options =>
                    {
                        WorkspaceAuthorizationPolicy.AddWorkspacePolicies(options);
                    });

                    // MediatR
                    services.AddMediatR(cfg =>
                        cfg.RegisterServicesFromAssembly(typeof(ICurrentUserService).Assembly));
                    services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

                    // FluentValidation
                    services.AddValidatorsFromAssembly(typeof(SyncSpace.Application.Features.Auth.DTOs.RegisterCommandValidator).Assembly);

                    // Current user
                    services.AddSingleton<ICurrentUserService>(new TestCurrentUserService(TestUserId));

                    // Mock services that need external dependencies
                    services.AddScoped<IJwtTokenService, JwtTokenService>();
                    services.AddScoped<IIdentityService, TestIdentityService>();
                    services.AddScoped<IRefreshTokenService, TestRefreshTokenService>();
                    services.AddScoped<IGoogleAuthService, TestGoogleAuthService>();
                    services.AddSingleton<ICloudinaryService, TestCloudinaryService>();
                    services.AddSingleton<INotificationService, TestNotificationService>();
                    services.AddSingleton<ISearchService, TestSearchService>();
                    services.AddSingleton<IAuditService, TestAuditService>();
                    services.AddSingleton<IAnalyticsService, TestAnalyticsService>();
                    services.AddSingleton<IOpenAIService, TestOpenAIService>();
                    services.AddSingleton<IAdminService, TestAdminService>();

                    // Controllers
                    services.AddControllers()
                        .AddApplicationPart(typeof(AuthController).Assembly);
                    services.AddHttpContextAccessor();
                });

                webBuilder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Jwt:Key"] = TestJwtKey,
                        ["Jwt:Issuer"] = TestJwtIssuer,
                        ["Jwt:Audience"] = TestJwtAudience,
                        ["Jwt:ExpirationInMinutes"] = "60",
                        ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test"
                    });
                });

                webBuilder.Configure(app =>
                {
                    app.UseMiddleware<SyncSpace.API.Middleware.ExceptionHandlingMiddleware>();
                    app.UseRouting();
                    app.UseAuthentication();
                    app.UseAuthorization();
                    app.UseEndpoints(endpoints => endpoints.MapControllers());
                });
            })
            .Build();

        _host.Start();
    }

    public HttpClient GetHttpClient(bool authenticated = true)
    {
        var client = _host.GetTestServer().CreateClient();
        if (authenticated)
        {
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", GenerateTestJwt());
        }
        return client;
    }

    public string GenerateTestJwt(Guid? userId = null, string email = "test@test.com")
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, (userId ?? TestUserId).ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.GivenName, "Test"),
            new Claim(ClaimTypes.Surname, "User"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer: TestJwtIssuer, audience: TestJwtAudience,
            claims: claims, expires: DateTime.UtcNow.AddHours(1), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public void Dispose() => _host?.Dispose();
}

public class TestCurrentUserService : ICurrentUserService
{
    public TestCurrentUserService(Guid userId) { UserId = userId; }
    public Guid? UserId { get; }
    public string? Email => "test@test.com";
    public bool IsAuthenticated => true;
}

// Minimal test doubles for services that need external dependencies
public class TestIdentityService : IIdentityService
{
    private static readonly Dictionary<string, (Guid Id, string Password)> _users = new();

    public Task<(bool Success, string[] Errors)> CreateUserAsync(Guid userId, string email, string password, string firstName, string lastName)
    {
        if (_users.ContainsKey(email)) return Task.FromResult((false, new[] { "Email already exists" }));
        _users[email] = (userId, password);
        return Task.FromResult((true, Array.Empty<string>()));
    }
    public Task<(bool Success, string[] Errors)> CreateUserWithoutPasswordAsync(Guid userId, string email, string firstName, string lastName, string? avatarUrl)
    {
        _users[email] = (userId, "");
        return Task.FromResult((true, Array.Empty<string>()));
    }
    public Task<(bool Success, string[] Errors)> AddToRoleAsync(Guid userId, string role) => Task.FromResult((true, Array.Empty<string>()));
    public Task<(bool Success, string Error)> CheckPasswordAsync(string email, string password)
    {
        if (_users.TryGetValue(email, out var u) && u.Password == password) return Task.FromResult((true, ""));
        return Task.FromResult((false, "Invalid credentials"));
    }
    public Task<IList<string>> GetRolesAsync(Guid userId) => Task.FromResult<IList<string>>(new List<string> { "Member" });
    public Task<UserInfo?> GetUserInfoAsync(Guid userId)
    {
        var entry = _users.FirstOrDefault(x => x.Value.Id == userId);
        if (entry.Key == null) return Task.FromResult<UserInfo?>(null);
        return Task.FromResult<UserInfo?>(new UserInfo { Id = userId, Email = entry.Key, FirstName = "Test", LastName = "User" });
    }
    public Task<UserInfo?> GetUserInfoByEmailAsync(string email)
    {
        if (!_users.TryGetValue(email, out var u)) return Task.FromResult<UserInfo?>(null);
        return Task.FromResult<UserInfo?>(new UserInfo { Id = u.Id, Email = email, FirstName = "Test", LastName = "User" });
    }
    public Task<DateTime?> GetLockoutEndAsync(Guid userId) => Task.FromResult<DateTime?>(null);
    public Task<int> GetFailedLoginAttemptsAsync(Guid userId) => Task.FromResult(0);
    public Task<bool> IsUserActiveAsync(Guid userId) => Task.FromResult(true);
    public Task<bool> LockoutUserAsync(Guid userId, TimeSpan duration) => Task.FromResult(true);
    public Task<bool> ResetFailedAttemptsAsync(Guid userId) => Task.FromResult(true);
    public Task<bool> IncrementFailedAttemptsAsync(Guid userId) => Task.FromResult(true);
    public Task<bool> SetLastLoginAsync(Guid userId) => Task.FromResult(true);
    public Task<bool> DeactivateUserAsync(Guid userId) => Task.FromResult(true);
}

public class TestRefreshTokenService : IRefreshTokenService
{
    private static readonly List<Domain.Entities.RefreshToken> _tokens = new();
    public Task<Domain.Entities.RefreshToken?> GetActiveTokenAsync(string token, Guid userId)
        => Task.FromResult(_tokens.FirstOrDefault(t => t.Token == token && t.UserId == userId && t.IsActive));
    public Task SaveTokenAsync(Domain.Entities.RefreshToken refreshToken)
    { _tokens.Add(refreshToken); return Task.CompletedTask; }
    public Task RevokeTokenAsync(Domain.Entities.RefreshToken refreshToken, string? replacedByToken = null)
    { refreshToken.RevokedAt = DateTime.UtcNow; return Task.CompletedTask; }
}

public class TestGoogleAuthService : IGoogleAuthService
{
    public Task<ExternalUserInfo?> ValidateTokenAsync(string idToken)
        => Task.FromResult<ExternalUserInfo?>(null);
}

public class TestCloudinaryService : ICloudinaryService
{
    public Task<CloudinaryUploadResult> UploadFileAsync(Stream s, string f, string fo, CancellationToken ct = default)
        => Task.FromResult(new CloudinaryUploadResult { Success = true, PublicId = "test", Url = "http://test.com" });
    public Task<CloudinaryUploadResult> UploadImageAsync(Stream s, string f, string fo, int? mw = null, int? mh = null, CancellationToken ct = default)
        => Task.FromResult(new CloudinaryUploadResult { Success = true, PublicId = "test", Url = "http://test.com" });
    public Task<bool> DeleteFileAsync(string p, CancellationToken ct = default) => Task.FromResult(true);
    public string GetDownloadUrl(string p) => "http://test.com";
    public string GetPreviewUrl(string p, int? w = null, int? h = null) => "http://test.com";
    public string GetThumbnailUrl(string p, int s = 200) => "http://test.com";
    public Task<long> GetStorageUsageAsync(Guid w, CancellationToken ct = default) => Task.FromResult(0L);
}

public class TestNotificationService : INotificationService
{
    public Task SendNotificationAsync(Guid userId, Domain.Enums.NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default) => Task.CompletedTask;
    public Task SendBulkNotificationAsync(IEnumerable<Guid> userIds, Domain.Enums.NotificationType type, string title, string message, string? actionUrl = null, Guid? actorId = null, CancellationToken ct = default) => Task.CompletedTask;
}

public class TestSearchService : ISearchService
{
    public Task<Application.Features.Search.DTOs.SearchResult> SearchAsync(Application.Features.Search.DTOs.SearchRequest request, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Search.DTOs.SearchResult { Query = request.Query, TotalCount = 0, Categories = new(), ElapsedMs = 0 });
}

public class TestAuditService : IAuditService
{
    public Task LogAsync(Guid userId, Domain.Enums.AuditAction action, string entityType, Guid? entityId, Guid? workspaceId, string description, string? oldValue = null, string? newValue = null, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
        => Task.CompletedTask;
}

public class TestAnalyticsService : IAnalyticsService
{
    public Task<Application.Features.Analytics.DTOs.WorkspaceOverviewDto> GetWorkspaceOverviewAsync(Guid w, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Analytics.DTOs.WorkspaceOverviewDto());
    public Task<List<Application.Features.Analytics.DTOs.WorkspaceGrowthDto>> GetWorkspaceGrowthAsync(Guid w, int m, CancellationToken ct = default)
        => Task.FromResult(new List<Application.Features.Analytics.DTOs.WorkspaceGrowthDto>());
    public Task<List<Application.Features.Analytics.DTOs.TopMemberDto>> GetTopMembersAsync(Guid w, int l, CancellationToken ct = default)
        => Task.FromResult(new List<Application.Features.Analytics.DTOs.TopMemberDto>());
    public Task<List<Application.Features.Analytics.DTOs.TaskStatusDto>> GetTaskStatusAsync(Guid w, CancellationToken ct = default)
        => Task.FromResult(new List<Application.Features.Analytics.DTOs.TaskStatusDto>());
    public Task<List<Application.Features.Analytics.DTOs.TimelinePointDto>> GetDocumentCreationAsync(Guid w, int m, CancellationToken ct = default)
        => Task.FromResult(new List<Application.Features.Analytics.DTOs.TimelinePointDto>());
    public Task<List<Application.Features.Analytics.DTOs.TimelinePointDto>> GetMessageActivityAsync(Guid w, int m, CancellationToken ct = default)
        => Task.FromResult(new List<Application.Features.Analytics.DTOs.TimelinePointDto>());
}

public class TestOpenAIService : IOpenAIService
{
    private static readonly Application.Features.AI.DTOs.AIResponse _defaultResponse = new() { Content = "Response", Model = "test", TokensUsed = 0 };
    public Task<Application.Features.AI.DTOs.AIResponse> SummarizeAsync(Application.Features.AI.DTOs.SummarizeRequest request, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
    public Task<Application.Features.AI.DTOs.AIResponse> GenerateMeetingNotesAsync(Application.Features.AI.DTOs.MeetingNotesRequest request, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
    public Task<Application.Features.AI.DTOs.AIResponse> RewriteAsync(Application.Features.AI.DTOs.RewriteRequest request, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
    public Task<Application.Features.AI.DTOs.AIResponse> CreateTaskListAsync(Application.Features.AI.DTOs.TaskListRequest request, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
    public Task<Application.Features.AI.DTOs.AIResponse> ExtractActionItemsAsync(Application.Features.AI.DTOs.ActionItemsRequest request, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
    public Task<Application.Features.AI.DTOs.AIResponse> ChatAsync(string systemPrompt, string userMessage, CancellationToken ct = default) => Task.FromResult(_defaultResponse);
}

public class TestAdminService : IAdminService
{
    public Task<Application.Features.Admin.DTOs.AdminOverviewDto> GetOverviewAsync(CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.AdminOverviewDto());
    public Task<Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminUserDto>> GetUsersAsync(string? s, int p, int ps, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminUserDto>());
    public Task<Application.Features.Admin.DTOs.AdminUserDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult<Application.Features.Admin.DTOs.AdminUserDto?>(null);
    public Task UpdateUserAsync(Application.Features.Admin.DTOs.UpdateUserRequest r, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteUserAsync(Guid id, CancellationToken ct = default) => Task.CompletedTask;
    public Task<Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminWorkspaceDto>> GetWorkspacesAsync(string? s, int p, int ps, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminWorkspaceDto>());
    public Task<Application.Features.Admin.DTOs.AdminWorkspaceDto?> GetWorkspaceByIdAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult<Application.Features.Admin.DTOs.AdminWorkspaceDto?>(null);
    public Task UpdateWorkspaceAsync(Application.Features.Admin.DTOs.UpdateWorkspaceRequest r, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteWorkspaceAsync(Guid id, CancellationToken ct = default) => Task.CompletedTask;
    public Task<Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminDocumentDto>> GetDocumentsAsync(Guid? w, string? s, int p, int ps, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminDocumentDto>());
    public Task<Application.Features.Admin.DTOs.AdminDocumentDto?> GetDocumentByIdAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult<Application.Features.Admin.DTOs.AdminDocumentDto?>(null);
    public Task DeleteDocumentAsync(Guid id, CancellationToken ct = default) => Task.CompletedTask;
    public Task<Application.Features.Admin.DTOs.StorageOverviewDto> GetStorageOverviewAsync(CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.StorageOverviewDto());
    public Task<Application.Features.Admin.DTOs.SystemHealthDto> GetSystemHealthAsync(CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.SystemHealthDto());
    public Task<Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminAuditLogDto>> GetAuditLogsAsync(string? a, Guid? u, Guid? w, int p, int ps, CancellationToken ct = default)
        => Task.FromResult(new Application.Features.Admin.DTOs.PaginatedList<Application.Features.Admin.DTOs.AdminAuditLogDto>());
}
