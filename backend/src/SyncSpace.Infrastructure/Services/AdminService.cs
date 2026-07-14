using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Npgsql;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Admin.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly string _connectionString;

    public AdminService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    // ===================== OVERVIEW =====================
    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var dto = new AdminOverviewDto();
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Users\"", conn))
            dto.TotalUsers = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(DISTINCT \"UserId\") FROM \"AuditLogs\" WHERE \"Action\" = 'UserLogin' AND \"CreatedAt\" >= NOW() - INTERVAL '30 days'", conn))
            dto.ActiveUsers = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Workspaces\"", conn))
            dto.TotalWorkspaces = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Documents\" WHERE \"IsDeleted\" = false", conn))
            dto.TotalDocuments = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Messages\"", conn))
            dto.TotalMessages = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*), COALESCE(SUM(\"Size\"), 0) FROM \"DriveFiles\" WHERE \"IsDeleted\" = false", conn))
        {
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct)) { dto.TotalFiles = r.GetInt32(0); dto.TotalStorageBytes = r.GetInt64(1); }
        }

        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"BoardCards\" bc INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" WHERE b.\"IsDeleted\" = false", conn))
            dto.TotalTasks = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Users\" WHERE \"CreatedAt\" >= NOW() - INTERVAL '30 days'", conn))
            dto.UsersLast30Days = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Documents\" WHERE \"CreatedAt\" >= NOW() - INTERVAL '30 days' AND \"IsDeleted\" = false", conn))
            dto.DocumentsLast30Days = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Messages\" WHERE \"CreatedAt\" >= NOW() - INTERVAL '30 days'", conn))
            dto.MessagesLast30Days = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));

        return dto;
    }

    // ===================== USERS =====================
    public async Task<PaginatedList<AdminUserDto>> GetUsersAsync(string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var result = new PaginatedList<AdminUserDto> { Page = page, PageSize = pageSize };
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var where = "";
        if (!string.IsNullOrEmpty(search))
            where = " WHERE (u.\"Email\" ILIKE @s OR u.\"FirstName\" ILIKE @s OR u.\"LastName\" ILIKE @s)";

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Users\" u" + where, conn))
        {
            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@s", $"%{search}%");
            result.TotalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        var offset = (page - 1) * pageSize;
        var sql = "SELECT u.\"Id\", u.\"Email\", u.\"FirstName\", u.\"LastName\", COALESCE(u.\"AvatarUrl\", '') , " +
            "CASE WHEN u.\"LockoutEnd\" IS NOT NULL AND u.\"LockoutEnd\" > NOW() THEN 'Locked' ELSE 'Active' END, " +
            "u.\"CreatedAt\", " +
            "(SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"UserId\" = u.\"Id\") AS ws_count, " +
            "(SELECT COUNT(*) FROM \"Documents\" WHERE \"CreatedBy\" = u.\"Id\" AND \"IsDeleted\" = false) AS doc_count, " +
            "(SELECT COUNT(*) FROM \"Messages\" WHERE \"SenderId\" = u.\"Id\") AS msg_count " +
            "FROM \"Users\" u" + where + " ORDER BY u.\"CreatedAt\" DESC LIMIT @limit OFFSET @offset";

        await using var cmd2 = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(search)) cmd2.Parameters.AddWithValue("@s", $"%{search}%");
        cmd2.Parameters.AddWithValue("@limit", pageSize);
        cmd2.Parameters.AddWithValue("@offset", offset);

        await using var reader = await cmd2.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            result.Items.Add(new AdminUserDto
            {
                Id = reader.GetGuid(0),
                Email = reader.GetString(1),
                FirstName = reader.GetString(2),
                LastName = reader.GetString(3),
                AvatarUrl = reader.GetString(4),
                Status = reader.GetString(5),
                CreatedAt = reader.GetDateTime(6),
                WorkspaceCount = reader.GetInt32(7),
                DocumentCount = reader.GetInt32(8),
                MessageCount = reader.GetInt32(9),
            });
        }
        return result;
    }

    public async Task<AdminUserDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var sql = "SELECT u.\"Id\", u.\"Email\", u.\"FirstName\", u.\"LastName\", COALESCE(u.\"AvatarUrl\", ''), " +
            "CASE WHEN u.\"LockoutEnd\" IS NOT NULL AND u.\"LockoutEnd\" > NOW() THEN 'Locked' ELSE 'Active' END, " +
            "u.\"CreatedAt\", " +
            "(SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"UserId\" = u.\"Id\"), " +
            "(SELECT COUNT(*) FROM \"Documents\" WHERE \"CreatedBy\" = u.\"Id\" AND \"IsDeleted\" = false), " +
            "(SELECT COUNT(*) FROM \"Messages\" WHERE \"SenderId\" = u.\"Id\") " +
            "FROM \"Users\" u WHERE u.\"Id\" = @uid";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@uid", userId);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        if (!await reader.ReadAsync(ct)) return null;
        return new AdminUserDto
        {
            Id = reader.GetGuid(0), Email = reader.GetString(1), FirstName = reader.GetString(2),
            LastName = reader.GetString(3), AvatarUrl = reader.GetString(4), Status = reader.GetString(5),
            CreatedAt = reader.GetDateTime(6), WorkspaceCount = reader.GetInt32(7),
            DocumentCount = reader.GetInt32(8), MessageCount = reader.GetInt32(9),
        };
    }

    public async Task UpdateUserAsync(UpdateUserRequest request, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var sets = new List<string>();
        var cmd = new NpgsqlCommand("UPDATE \"Users\" SET ", conn);
        var i = 0;

        if (request.FirstName != null) { sets.Add($"\"FirstName\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", request.FirstName); }
        if (request.LastName != null) { sets.Add($"\"LastName\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", request.LastName); }
        if (request.Email != null) { sets.Add($"\"Email\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", request.Email); }
        if (request.Status != null)
        {
            if (request.Status == "Locked")
            {
                sets.Add($"\"LockoutEnd\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", new DateTimeOffset(DateTime.UtcNow.AddYears(10)));
            }
            else
            {
                sets.Add($"\"LockoutEnd\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", (DateTimeOffset?)null);
            }
        }

        if (sets.Count == 0) return;
        cmd.CommandText += string.Join(", ", sets) + " WHERE \"Id\" = @uid";
        cmd.Parameters.AddWithValue("@uid", request.Id);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("DELETE FROM \"Users\" WHERE \"Id\" = @uid", conn);
        cmd.Parameters.AddWithValue("@uid", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    // ===================== WORKSPACES =====================
    public async Task<PaginatedList<AdminWorkspaceDto>> GetWorkspacesAsync(string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var result = new PaginatedList<AdminWorkspaceDto> { Page = page, PageSize = pageSize };
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var where = "";
        if (!string.IsNullOrEmpty(search))
            where = " WHERE w.\"Name\" ILIKE @s";

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Workspaces\" w" + where, conn))
        {
            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@s", $"%{search}%");
            result.TotalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        var offset = (page - 1) * pageSize;
        var sql = "SELECT w.\"Id\", w.\"Name\", COALESCE(w.\"Description\", ''), " +
            "COALESCE(u.\"FirstName\" || ' ' || u.\"LastName\", 'Unknown'), " +
            "(SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"WorkspaceId\" = w.\"Id\"), " +
            "(SELECT COUNT(*) FROM \"Documents\" WHERE \"WorkspaceId\" = w.\"Id\" AND \"IsDeleted\" = false), " +
            "(SELECT COUNT(*) FROM \"Boards\" WHERE \"WorkspaceId\" = w.\"Id\" AND \"IsDeleted\" = false), " +
            "w.\"CreatedAt\" " +
            "FROM \"Workspaces\" w LEFT JOIN \"Users\" u ON w.\"CreatedBy\" = u.\"Id\"" + where +
            " ORDER BY w.\"CreatedAt\" DESC LIMIT @limit OFFSET @offset";

        await using var cmd2 = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(search)) cmd2.Parameters.AddWithValue("@s", $"%{search}%");
        cmd2.Parameters.AddWithValue("@limit", pageSize);
        cmd2.Parameters.AddWithValue("@offset", offset);

        await using var reader = await cmd2.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            result.Items.Add(new AdminWorkspaceDto
            {
                Id = reader.GetGuid(0), Name = reader.GetString(1), Description = reader.GetString(2),
                OwnerName = reader.GetString(3), MemberCount = reader.GetInt32(4),
                DocumentCount = reader.GetInt32(5), BoardCount = reader.GetInt32(6),
                CreatedAt = reader.GetDateTime(7),
            });
        }
        return result;
    }

    public async Task<AdminWorkspaceDto?> GetWorkspaceByIdAsync(Guid workspaceId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var sql = "SELECT w.\"Id\", w.\"Name\", COALESCE(w.\"Description\", ''), " +
            "COALESCE(u.\"FirstName\" || ' ' || u.\"LastName\", 'Unknown'), " +
            "(SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"WorkspaceId\" = w.\"Id\"), " +
            "(SELECT COUNT(*) FROM \"Documents\" WHERE \"WorkspaceId\" = w.\"Id\" AND \"IsDeleted\" = false), " +
            "(SELECT COUNT(*) FROM \"Boards\" WHERE \"WorkspaceId\" = w.\"Id\" AND \"IsDeleted\" = false), " +
            "w.\"CreatedAt\" " +
            "FROM \"Workspaces\" w LEFT JOIN \"Users\" u ON w.\"CreatedBy\" = u.\"Id\" WHERE w.\"Id\" = @wid";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        return new AdminWorkspaceDto
        {
            Id = reader.GetGuid(0), Name = reader.GetString(1), Description = reader.GetString(2),
            OwnerName = reader.GetString(3), MemberCount = reader.GetInt32(4),
            DocumentCount = reader.GetInt32(5), BoardCount = reader.GetInt32(6),
            CreatedAt = reader.GetDateTime(7),
        };
    }

    public async Task UpdateWorkspaceAsync(UpdateWorkspaceRequest request, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var sets = new List<string>();
        var cmd = new NpgsqlCommand("UPDATE \"Workspaces\" SET ", conn);
        var i = 0;
        if (request.Name != null) { sets.Add($"\"Name\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", request.Name); }
        if (request.Description != null) { sets.Add($"\"Description\" = @p{i}"); cmd.Parameters.AddWithValue($"@p{i++}", request.Description); }
        if (sets.Count == 0) return;
        cmd.CommandText += string.Join(", ", sets) + " WHERE \"Id\" = @wid";
        cmd.Parameters.AddWithValue("@wid", request.Id);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DeleteWorkspaceAsync(Guid workspaceId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("DELETE FROM \"Workspaces\" WHERE \"Id\" = @wid", conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    // ===================== DOCUMENTS =====================
    public async Task<PaginatedList<AdminDocumentDto>> GetDocumentsAsync(Guid? workspaceId, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var result = new PaginatedList<AdminDocumentDto> { Page = page, PageSize = pageSize };
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var where = " WHERE d.\"IsDeleted\" = false";
        if (workspaceId.HasValue) where += " AND d.\"WorkspaceId\" = @wid";
        if (!string.IsNullOrEmpty(search)) where += " AND d.\"Title\" ILIKE @s";

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Documents\" d" + where, conn))
        {
            if (workspaceId.HasValue) cmd.Parameters.AddWithValue("@wid", workspaceId.Value);
            if (!string.IsNullOrEmpty(search)) cmd.Parameters.AddWithValue("@s", $"%{search}%");
            result.TotalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        var offset = (page - 1) * pageSize;
        var sql = "SELECT d.\"Id\", d.\"Title\", " +
            "COALESCE(u.\"FirstName\" || ' ' || u.\"LastName\", 'Unknown'), " +
            "COALESCE(w.\"Name\", 'Unknown'), " +
            "COALESCE(LENGTH(d.\"Content\"), 0), d.\"CurrentVersion\", d.\"CreatedAt\", d.\"UpdatedAt\" " +
            "FROM \"Documents\" d " +
            "LEFT JOIN \"Users\" u ON d.\"CreatedBy\" = u.\"Id\" " +
            "LEFT JOIN \"Workspaces\" w ON d.\"WorkspaceId\" = w.\"Id\"" + where +
            " ORDER BY d.\"UpdatedAt\" DESC LIMIT @limit OFFSET @offset";

        await using var cmd2 = new NpgsqlCommand(sql, conn);
        if (workspaceId.HasValue) cmd2.Parameters.AddWithValue("@wid", workspaceId.Value);
        if (!string.IsNullOrEmpty(search)) cmd2.Parameters.AddWithValue("@s", $"%{search}%");
        cmd2.Parameters.AddWithValue("@limit", pageSize);
        cmd2.Parameters.AddWithValue("@offset", offset);

        await using var reader = await cmd2.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            result.Items.Add(new AdminDocumentDto
            {
                Id = reader.GetGuid(0), Title = reader.GetString(1), AuthorName = reader.GetString(2),
                WorkspaceName = reader.GetString(3), WordCount = reader.GetInt32(4) / 5,
                CurrentVersion = reader.GetInt32(5), CreatedAt = reader.GetDateTime(6),
                UpdatedAt = reader.GetDateTime(7),
            });
        }
        return result;
    }

    public async Task<AdminDocumentDto?> GetDocumentByIdAsync(Guid documentId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var sql = "SELECT d.\"Id\", d.\"Title\", " +
            "COALESCE(u.\"FirstName\" || ' ' || u.\"LastName\", 'Unknown'), " +
            "COALESCE(w.\"Name\", 'Unknown'), " +
            "COALESCE(LENGTH(d.\"Content\"), 0), d.\"CurrentVersion\", d.\"CreatedAt\", d.\"UpdatedAt\" " +
            "FROM \"Documents\" d " +
            "LEFT JOIN \"Users\" u ON d.\"CreatedBy\" = u.\"Id\" " +
            "LEFT JOIN \"Workspaces\" w ON d.\"WorkspaceId\" = w.\"Id\" WHERE d.\"Id\" = @did";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@did", documentId);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;
        return new AdminDocumentDto
        {
            Id = reader.GetGuid(0), Title = reader.GetString(1), AuthorName = reader.GetString(2),
            WorkspaceName = reader.GetString(3), WordCount = reader.GetInt32(4) / 5,
            CurrentVersion = reader.GetInt32(5), CreatedAt = reader.GetDateTime(6),
            UpdatedAt = reader.GetDateTime(7),
        };
    }

    public async Task DeleteDocumentAsync(Guid documentId, CancellationToken ct = default)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand("UPDATE \"Documents\" SET \"IsDeleted\" = true WHERE \"Id\" = @did", conn);
        cmd.Parameters.AddWithValue("@did", documentId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    // ===================== STORAGE =====================
    public async Task<StorageOverviewDto> GetStorageOverviewAsync(CancellationToken ct = default)
    {
        var dto = new StorageOverviewDto();
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*), COALESCE(SUM(\"Size\"), 0) FROM \"DriveFiles\" WHERE \"IsDeleted\" = false", conn))
        {
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct)) { dto.TotalFiles = r.GetInt32(0); dto.TotalStorageBytes = r.GetInt64(1); }
        }

        var wsSql = "SELECT w.\"Id\", w.\"Name\", COALESCE(SUM(df.\"Size\"), 0), COUNT(df.\"Id\") " +
            "FROM \"Workspaces\" w LEFT JOIN \"DriveFiles\" df ON df.\"WorkspaceId\" = w.\"Id\" AND df.\"IsDeleted\" = false " +
            "GROUP BY w.\"Id\", w.\"Name\" ORDER BY COALESCE(SUM(df.\"Size\"), 0) DESC";
        await using (var cmd = new NpgsqlCommand(wsSql, conn))
        {
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
                dto.ByWorkspace.Add(new StorageByWorkspaceDto
                {
                    WorkspaceId = r.GetGuid(0), WorkspaceName = r.GetString(1),
                    SizeBytes = r.GetInt64(2), FileCount = r.GetInt32(3)
                });
        }

        var typeSql = "SELECT \"FileType\", SUM(\"Size\"), COUNT(*) FROM \"DriveFiles\" WHERE \"IsDeleted\" = false " +
            "GROUP BY \"FileType\" ORDER BY SUM(\"Size\") DESC";
        await using (var cmd = new NpgsqlCommand(typeSql, conn))
        {
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
                dto.ByType.Add(new StorageByTypeDto
                {
                    FileType = r.GetString(0), SizeBytes = r.GetInt64(1), FileCount = r.GetInt32(2)
                });
        }

        return dto;
    }

    // ===================== SYSTEM HEALTH =====================
    public async Task<SystemHealthDto> GetSystemHealthAsync(CancellationToken ct = default)
    {
        var dto = new SystemHealthDto
        {
            RuntimeVersion = Environment.Version.ToString(),
            ServerTime = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            ProcessMemoryMB = Process.GetCurrentProcess().WorkingSet64 / (1024 * 1024),
            ThreadCount = Process.GetCurrentProcess().Threads.Count,
            UptimeDays = (int)(DateTime.UtcNow - Process.GetCurrentProcess().StartTime).TotalDays,
        };

        // Database check
        var sw = Stopwatch.StartNew();
        try
        {
            await using var conn = CreateConnection();
            await conn.OpenAsync(ct);
            await using var cmd = new NpgsqlCommand("SELECT 1", conn);
            await cmd.ExecuteScalarAsync(ct);
            sw.Stop();
            dto.DatabaseConnected = true;
            dto.DatabaseResponseMs = sw.Elapsed.TotalMilliseconds;
            dto.Checks["Database"] = $"Connected ({sw.Elapsed.TotalMilliseconds:F1}ms)";
        }
        catch (Exception ex)
        {
            sw.Stop();
            dto.DatabaseConnected = false;
            dto.Status = "degraded";
            dto.Checks["Database"] = $"Failed: {ex.Message}";
        }

        return dto;
    }

    // ===================== AUDIT LOGS =====================
    public async Task<PaginatedList<AdminAuditLogDto>> GetAuditLogsAsync(string? action, Guid? userId, Guid? workspaceId, int page, int pageSize, CancellationToken ct = default)
    {
        var result = new PaginatedList<AdminAuditLogDto> { Page = page, PageSize = pageSize };
        await using var conn = CreateConnection();
        await conn.OpenAsync(ct);

        var where = "";
        if (!string.IsNullOrEmpty(action)) where += " AND al.\"Action\" = @action";
        if (userId.HasValue) where += " AND al.\"UserId\" = @uid";
        if (workspaceId.HasValue) where += " AND al.\"WorkspaceId\" = @wid";

        await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"AuditLogs\" al WHERE 1=1" + where, conn))
        {
            if (!string.IsNullOrEmpty(action)) cmd.Parameters.AddWithValue("@action", action);
            if (userId.HasValue) cmd.Parameters.AddWithValue("@uid", userId.Value);
            if (workspaceId.HasValue) cmd.Parameters.AddWithValue("@wid", workspaceId.Value);
            result.TotalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        var offset = (page - 1) * pageSize;
        var sql = "SELECT al.\"Id\", u.\"FirstName\" || ' ' || u.\"LastName\", al.\"Action\", al.\"EntityType\", " +
            "al.\"EntityId\", al.\"Description\", al.\"IpAddress\", al.\"CreatedAt\" " +
            "FROM \"AuditLogs\" al INNER JOIN \"Users\" u ON al.\"UserId\" = u.\"Id\" WHERE 1=1" + where +
            " ORDER BY al.\"CreatedAt\" DESC LIMIT @limit OFFSET @offset";

        await using var cmd2 = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(action)) cmd2.Parameters.AddWithValue("@action", action);
        if (userId.HasValue) cmd2.Parameters.AddWithValue("@uid", userId.Value);
        if (workspaceId.HasValue) cmd2.Parameters.AddWithValue("@wid", workspaceId.Value);
        cmd2.Parameters.AddWithValue("@limit", pageSize);
        cmd2.Parameters.AddWithValue("@offset", offset);

        await using var reader = await cmd2.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            result.Items.Add(new AdminAuditLogDto
            {
                Id = reader.GetGuid(0), UserName = reader.GetString(1), Action = reader.GetString(2),
                EntityType = reader.GetString(3), EntityId = reader.IsDBNull(4) ? null : reader.GetGuid(4),
                Description = reader.GetString(5), IpAddress = reader.IsDBNull(6) ? null : reader.GetString(6),
                CreatedAt = reader.GetDateTime(7),
            });
        }
        return result;
    }
}
