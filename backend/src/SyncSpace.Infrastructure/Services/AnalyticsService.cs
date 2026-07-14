using Microsoft.Extensions.Configuration;
using Npgsql;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Analytics.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly string _connectionString;

    public AnalyticsService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<WorkspaceOverviewDto> GetWorkspaceOverviewAsync(Guid workspaceId, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var dto = new WorkspaceOverviewDto();

        // Total members
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"WorkspaceId\" = @wid", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.TotalMembers = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Active users (logged in within last 30 days)
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(DISTINCT al.\"UserId\") FROM \"AuditLogs\" al " +
            "WHERE al.\"WorkspaceId\" = @wid AND al.\"Action\" = 'UserLogin' " +
            "AND al.\"CreatedAt\" >= NOW() - INTERVAL '30 days'", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.ActiveUsers = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Active users (last 7 days)
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(DISTINCT al.\"UserId\") FROM \"AuditLogs\" al " +
            "WHERE al.\"WorkspaceId\" = @wid AND al.\"Action\" = 'UserLogin' " +
            "AND al.\"CreatedAt\" >= NOW() - INTERVAL '7 days'", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.ActiveUsersLast7Days = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Total documents
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"Documents\" WHERE \"WorkspaceId\" = @wid AND \"IsDeleted\" = false", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.TotalDocuments = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Total tasks
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"BoardCards\" bc " +
            "INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" " +
            "INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.TotalTasks = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Completed tasks (column name contains 'done' or 'complete' - case insensitive)
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"BoardCards\" bc " +
            "INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" " +
            "INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false " +
            "AND LOWER(col.\"Name\") IN ('done', 'completed', 'finished', 'resolved', 'closed')", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.CompletedTasks = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        dto.TaskCompletionRate = dto.TotalTasks > 0
            ? Math.Round((double)dto.CompletedTasks / dto.TotalTasks * 100, 1)
            : 0;

        // Total messages
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM \"Messages\" m " +
            "INNER JOIN \"Channels\" ch ON m.\"ChannelId\" = ch.\"Id\" " +
            "WHERE ch.\"WorkspaceId\" = @wid", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            dto.TotalMessages = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
        }

        // Total files + storage
        await using (var cmd = new NpgsqlCommand(
            "SELECT COUNT(*), COALESCE(SUM(\"Size\"), 0) FROM \"DriveFiles\" " +
            "WHERE \"WorkspaceId\" = @wid AND \"IsDeleted\" = false", conn))
        {
            cmd.Parameters.AddWithValue("@wid", workspaceId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                dto.TotalFiles = reader.GetInt32(0);
                dto.TotalStorageBytes = reader.GetInt64(1);
            }
        }

        return dto;
    }

    public async Task<List<WorkspaceGrowthDto>> GetWorkspaceGrowthAsync(Guid workspaceId, int months, CancellationToken ct = default)
    {
        var results = new List<WorkspaceGrowthDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT to_char(d, 'YYYY-MM') AS label, " +
            "(SELECT COUNT(*) FROM \"WorkspaceMembers\" WHERE \"WorkspaceId\" = @wid AND \"JoinedAt\" <= d + INTERVAL '1 month') AS members, " +
            "(SELECT COUNT(*) FROM \"Documents\" WHERE \"WorkspaceId\" = @wid AND \"CreatedAt\" < d + INTERVAL '1 month' AND \"IsDeleted\" = false) AS documents, " +
            "(SELECT COUNT(*) FROM \"BoardCards\" bc " +
            "INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" " +
            "INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false AND bc.\"CreatedAt\" < d + INTERVAL '1 month') AS tasks, " +
            "(SELECT COUNT(*) FROM \"Messages\" m " +
            "INNER JOIN \"Channels\" ch ON m.\"ChannelId\" = ch.\"Id\" " +
            "WHERE ch.\"WorkspaceId\" = @wid AND m.\"CreatedAt\" < d + INTERVAL '1 month') AS messages " +
            "FROM generate_series(NOW() - (@months || ' months')::interval, NOW(), '1 month') AS d " +
            "ORDER BY d";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@months", months);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            results.Add(new WorkspaceGrowthDto
            {
                Label = reader.GetString(0),
                Members = reader.GetInt32(1),
                Documents = reader.GetInt32(2),
                Tasks = reader.GetInt32(3),
                Messages = reader.GetInt32(4)
            });
        }

        return results;
    }

    public async Task<List<TopMemberDto>> GetTopMembersAsync(Guid workspaceId, int limit, CancellationToken ct = default)
    {
        var results = new List<TopMemberDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT u.\"Id\", u.\"FirstName\" || ' ' || u.\"LastName\" AS full_name, " +
            "COALESCE(u.\"AvatarUrl\", '') AS avatar_url, " +
            "COALESCE(task_stats.cnt, 0) AS task_count, " +
            "COALESCE(doc_stats.cnt, 0) AS doc_count, " +
            "COALESCE(msg_stats.cnt, 0) AS msg_count " +
            "FROM \"WorkspaceMembers\" wm " +
            "INNER JOIN \"Users\" u ON wm.\"UserId\" = u.\"Id\" " +
            "LEFT JOIN ( " +
            "  SELECT bc.\"CreatedBy\", COUNT(*) AS cnt FROM \"BoardCards\" bc " +
            "  INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" " +
            "  INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "  WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false " +
            "  GROUP BY bc.\"CreatedBy\" " +
            ") task_stats ON task_stats.\"CreatedBy\" = u.\"Id\" " +
            "LEFT JOIN ( " +
            "  SELECT d.\"CreatedBy\", COUNT(*) AS cnt FROM \"Documents\" d " +
            "  WHERE d.\"WorkspaceId\" = @wid AND d.\"IsDeleted\" = false " +
            "  GROUP BY d.\"CreatedBy\" " +
            ") doc_stats ON doc_stats.\"CreatedBy\" = u.\"Id\" " +
            "LEFT JOIN ( " +
            "  SELECT m.\"SenderId\", COUNT(*) AS cnt FROM \"Messages\" m " +
            "  INNER JOIN \"Channels\" ch ON m.\"ChannelId\" = ch.\"Id\" " +
            "  WHERE ch.\"WorkspaceId\" = @wid " +
            "  GROUP BY m.\"SenderId\" " +
            ") msg_stats ON msg_stats.\"SenderId\" = u.\"Id\" " +
            "WHERE wm.\"WorkspaceId\" = @wid " +
            "ORDER BY (COALESCE(task_stats.cnt, 0) + COALESCE(doc_stats.cnt, 0) + COALESCE(msg_stats.cnt, 0)) DESC " +
            "LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var taskCount = reader.GetInt32(3);
            var docCount = reader.GetInt32(4);
            var msgCount = reader.GetInt32(5);

            results.Add(new TopMemberDto
            {
                UserId = reader.GetGuid(0),
                FullName = reader.GetString(1),
                AvatarUrl = reader.GetString(2),
                TaskCount = taskCount,
                DocumentCount = docCount,
                MessageCount = msgCount,
                TotalActivity = taskCount + docCount + msgCount
            });
        }

        return results;
    }

    public async Task<List<TaskStatusDto>> GetTaskStatusAsync(Guid workspaceId, CancellationToken ct = default)
    {
        var results = new List<TaskStatusDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT col.\"Name\", COUNT(bc.\"Id\") AS cnt " +
            "FROM \"BoardColumns\" col " +
            "INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "LEFT JOIN \"BoardCards\" bc ON bc.\"ColumnId\" = col.\"Id\" " +
            "WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false " +
            "GROUP BY col.\"Name\" " +
            "ORDER BY cnt DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            results.Add(new TaskStatusDto
            {
                ColumnName = reader.GetString(0),
                Count = reader.GetInt32(1)
            });
        }

        return results;
    }

    public async Task<List<TimelinePointDto>> GetDocumentCreationAsync(Guid workspaceId, int months, CancellationToken ct = default)
    {
        var results = new List<TimelinePointDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT to_char(d, 'YYYY-MM') AS label, " +
            "COALESCE(sub.cnt, 0) AS value " +
            "FROM generate_series(NOW() - (@months || ' months')::interval, NOW(), '1 month') AS d " +
            "LEFT JOIN LATERAL ( " +
            "  SELECT COUNT(*) AS cnt FROM \"Documents\" " +
            "  WHERE \"WorkspaceId\" = @wid AND \"IsDeleted\" = false " +
            "  AND \"CreatedAt\" >= d AND \"CreatedAt\" < d + INTERVAL '1 month' " +
            ") sub ON true " +
            "ORDER BY d";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@months", months);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            results.Add(new TimelinePointDto
            {
                Label = reader.GetString(0),
                Value = reader.GetInt32(1)
            });
        }

        return results;
    }

    public async Task<List<TimelinePointDto>> GetMessageActivityAsync(Guid workspaceId, int months, CancellationToken ct = default)
    {
        var results = new List<TimelinePointDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT to_char(d, 'YYYY-MM') AS label, " +
            "COALESCE(sub.cnt, 0) AS value " +
            "FROM generate_series(NOW() - (@months || ' months')::interval, NOW(), '1 month') AS d " +
            "LEFT JOIN LATERAL ( " +
            "  SELECT COUNT(*) AS cnt FROM \"Messages\" m " +
            "  INNER JOIN \"Channels\" ch ON m.\"ChannelId\" = ch.\"Id\" " +
            "  WHERE ch.\"WorkspaceId\" = @wid " +
            "  AND m.\"CreatedAt\" >= d AND m.\"CreatedAt\" < d + INTERVAL '1 month' " +
            ") sub ON true " +
            "ORDER BY d";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@months", months);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            results.Add(new TimelinePointDto
            {
                Label = reader.GetString(0),
                Value = reader.GetInt32(1)
            });
        }

        return results;
    }
}
