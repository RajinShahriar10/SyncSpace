using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Audit.DTOs;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly string _connectionString;

    public AuditController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? workspaceId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? entityType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
    {
        var offset = (page - 1) * pageSize;
        var logs = new List<AuditLogDto>();
        var totalCount = 0;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        // Count
        var countSql = "SELECT COUNT(*) FROM \"AuditLogs\" al WHERE 1=1";
        var filterSql = "";

        if (workspaceId.HasValue)
        {
            filterSql += " AND al.\"WorkspaceId\" = @wid";
        }
        if (!string.IsNullOrEmpty(action))
        {
            filterSql += " AND al.\"Action\" = @action";
        }
        if (!string.IsNullOrEmpty(entityType))
        {
            filterSql += " AND al.\"EntityType\" = @entityType";
        }

        await using (var countCmd = new NpgsqlCommand(countSql + filterSql, conn))
        {
            if (workspaceId.HasValue) countCmd.Parameters.AddWithValue("@wid", workspaceId.Value);
            if (!string.IsNullOrEmpty(action)) countCmd.Parameters.AddWithValue("@action", action);
            if (!string.IsNullOrEmpty(entityType)) countCmd.Parameters.AddWithValue("@entityType", entityType);
            totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync(ct));
        }

        // Data
        var dataSql = "SELECT al.\"Id\", al.\"UserId\", u.\"FirstName\" || ' ' || u.\"LastName\" AS user_name, " +
            "COALESCE(u.\"AvatarUrl\", '') AS avatar_url, " +
            "al.\"Action\", al.\"EntityType\", al.\"EntityId\", al.\"WorkspaceId\", " +
            "al.\"Description\", al.\"OldValue\", al.\"NewValue\", al.\"CreatedAt\" " +
            "FROM \"AuditLogs\" al " +
            "INNER JOIN \"Users\" u ON al.\"UserId\" = u.\"Id\" " +
            "WHERE 1=1" + filterSql + " " +
            "ORDER BY al.\"CreatedAt\" DESC " +
            "LIMIT @limit OFFSET @offset";

        await using var cmd = new NpgsqlCommand(dataSql, conn);
        if (workspaceId.HasValue) cmd.Parameters.AddWithValue("@wid", workspaceId.Value);
        if (!string.IsNullOrEmpty(action)) cmd.Parameters.AddWithValue("@action", action);
        if (!string.IsNullOrEmpty(entityType)) cmd.Parameters.AddWithValue("@entityType", entityType);
        cmd.Parameters.AddWithValue("@limit", pageSize);
        cmd.Parameters.AddWithValue("@offset", offset);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            logs.Add(new AuditLogDto
            {
                Id = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                UserName = reader.GetString(2),
                UserAvatarUrl = reader.GetString(3),
                Action = reader.GetString(4),
                EntityType = reader.GetString(5),
                EntityId = reader.IsDBNull(6) ? null : reader.GetGuid(6),
                WorkspaceId = reader.IsDBNull(7) ? null : reader.GetGuid(7),
                Description = reader.GetString(8),
                OldValue = reader.IsDBNull(9) ? null : reader.GetString(10),
                NewValue = reader.IsDBNull(10) ? null : reader.GetString(11),
                CreatedAt = reader.GetDateTime(11)
            });
        }

        return Ok(new
        {
            success = true,
            data = logs,
            pagination = new { page, pageSize, totalCount, totalPages = (int)Math.Ceiling(totalCount / (double)pageSize) }
        });
    }
}
