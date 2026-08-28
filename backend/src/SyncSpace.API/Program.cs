using System.IO.Compression;
using System.Text;
using FluentValidation;
using HealthChecks.NpgSql;
using HealthChecks.Redis;
using MediatR;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SyncSpace.Application.Common.Behaviours;
using SyncSpace.Infrastructure;
using SyncSpace.Persistence;
using SyncSpace.Persistence.Context;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://+:{port}");

// Production logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Response Compression (Brotli + Gzip)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["application/json", "text/plain", "text/html", "text/css", "application/javascript"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

// Database
builder.Services.AddPersistence(builder.Configuration);

// Infrastructure (Auth, Identity, JWT)
builder.Services.AddInfrastructure(builder.Configuration);

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(SyncSpace.Application.Common.Interfaces.ICurrentUserService).Assembly));

// FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(SyncSpace.Application.Features.Auth.DTOs.RegisterCommandValidator).Assembly);

// Pipeline behaviors
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
            new[] { "http://localhost:3000" };
        var extraOrigins = new[] { "https://syncspace-work.vercel.app", "https://carrier-sudden-purpose-senate.trycloudflare.com" };
        var allOrigins = origins.Concat(extraOrigins).Distinct().ToArray();

        policy.WithOrigins(allOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("auth", opts =>
    {
        opts.PermitLimit = 10;
        opts.Window = TimeSpan.FromMinutes(1);
        opts.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("api", opts =>
    {
        opts.PermitLimit = 100;
        opts.Window = TimeSpan.FromMinutes(1);
        opts.QueueLimit = 10;
    });
});

// Anti-forgery
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

// RBAC Authorization
builder.Services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, SyncSpace.API.Authorization.RequireWorkspaceRoleHandler>();
builder.Services.AddAuthorization(options =>
{
    SyncSpace.API.Authorization.WorkspaceAuthorizationPolicy.AddWorkspacePolicies(options);
});

// OpenAPI
builder.Services.AddOpenApi();

// SignalR
builder.Services.AddSignalR();

// Contribution Engine
builder.Services.AddScoped<SyncSpace.API.Services.IContributionEngine, SyncSpace.API.Services.ContributionEngine>();

// Instructor Dashboard
builder.Services.AddScoped<SyncSpace.API.Services.IInstructorDashboardService, SyncSpace.API.Services.InstructorDashboardService>();

// Milestone Management
builder.Services.AddScoped<SyncSpace.API.Services.IMilestoneService, SyncSpace.API.Services.MilestoneService>();

// Risk Detection
builder.Services.AddScoped<SyncSpace.API.Services.IRiskDetectionService, SyncSpace.API.Services.RiskDetectionService>();

// Academic Reports
builder.Services.AddScoped<SyncSpace.API.Services.IAcademicReportService, SyncSpace.API.Services.AcademicReportService>();

// Health Checks
var dbConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrWhiteSpace(dbConn))
{
    builder.Services.AddHealthChecks()
        .AddNpgSql(
            dbConn,
            name: "database",
            failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded,
            tags: ["db", "ready"]);
}
else
{
    builder.Services.AddHealthChecks();
}

var app = builder.Build();

// Auto-migrate (best effort - don't crash app if DB unreachable)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SyncSpaceDbContext>();
    await db.Database.MigrateAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole<Guid>>>();
    string[] roles = ["Admin", "Member", "Viewer"];
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole<Guid>(role));
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database migration failed (continuing startup): {ex.Message}");
}

// Middleware pipeline
app.UseResponseCompression();
app.UseMiddleware<SyncSpace.API.Middleware.ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds
            })
        };
        await context.Response.WriteAsJsonAsync(result);
    },
    Predicate = _ => true
});
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHub<SyncSpace.API.Hubs.DocumentHub>("/hubs/documents");
app.MapHub<SyncSpace.API.Hubs.ChatHub>("/hubs/chat");
app.MapHub<SyncSpace.API.Hubs.NotificationHub>("/hubs/notifications");

app.Run();
