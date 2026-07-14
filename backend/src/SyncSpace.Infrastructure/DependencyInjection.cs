using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Infrastructure.Identity;
using SyncSpace.Persistence.Context;

namespace SyncSpace.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Identity
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredUniqueChars = 1;

            options.User.RequireUniqueEmail = true;
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            options.SignIn.RequireConfirmedEmail = false;
            options.SignIn.RequireConfirmedAccount = false;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<SyncSpaceDbContext>()
        .AddDefaultTokenProviders();

        // JWT Authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(configuration["Jwt:Key"]
                        ?? throw new InvalidOperationException("JWT key not configured"))),
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            options.Events = new JwtBearerEvents
            {
                OnChallenge = context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    var result = JsonSerializer.Serialize(new { success = false, message = "Unauthorized" });
                    var bytes = Encoding.UTF8.GetBytes(result);
                    return context.Response.Body.WriteAsync(bytes, 0, bytes.Length);
                },
                OnForbidden = context =>
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    var result = JsonSerializer.Serialize(new { success = false, message = "Forbidden" });
                    var bytes = Encoding.UTF8.GetBytes(result);
                    return context.Response.Body.WriteAsync(bytes, 0, bytes.Length);
                }
            };
        });

        services.AddAuthorization();

        // Application services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();
        services.AddHttpClient<IGithubAuthService, GithubAuthService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.ICloudinaryService, SyncSpace.Infrastructure.Services.CloudinaryService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.INotificationService, SyncSpace.Infrastructure.Services.NotificationService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.ISearchService, SyncSpace.Infrastructure.Services.SearchService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.IAuditService, SyncSpace.Infrastructure.Services.AuditService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.IAnalyticsService, SyncSpace.Infrastructure.Services.AnalyticsService>();

        // Register cached decorators (these wrap the real services when Redis is available)
        services.AddScoped<SyncSpace.Infrastructure.Services.CachedAnalyticsService>();
        services.AddScoped<SyncSpace.Infrastructure.Services.CachedSearchService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.IOpenAIService, SyncSpace.Infrastructure.Services.OpenAIService>();
        services.AddScoped<SyncSpace.Application.Common.Interfaces.IAdminService, SyncSpace.Infrastructure.Services.AdminService>();
        services.AddHttpContextAccessor();

        return services;
    }
}
