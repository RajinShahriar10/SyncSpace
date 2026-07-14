using Microsoft.Extensions.Configuration;
using Npgsql;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.Search.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly string _connectionString;

    public SearchService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    public async Task<SearchResult> SearchAsync(SearchRequest request, CancellationToken ct = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var query = request.Query.Trim();
        var tsQuery = ToTsQuery(query);

        var categories = new List<SearchCategoryResult>();
        var category = request.Category?.ToLowerInvariant();

        if (category is null or "documents")
        {
            var items = await SearchDocuments(tsQuery, request.WorkspaceId, request.Limit, ct);
            categories.Add(new SearchCategoryResult
            {
                Category = "documents",
                Label = "Documents",
                TotalCount = items.Count,
                Items = items
            });
        }

        if (category is null or "tasks")
        {
            var items = await SearchTasks(tsQuery, request.WorkspaceId, request.Limit, ct);
            categories.Add(new SearchCategoryResult
            {
                Category = "tasks",
                Label = "Tasks",
                TotalCount = items.Count,
                Items = items
            });
        }

        if (category is null or "chats")
        {
            var items = await SearchMessages(tsQuery, request.WorkspaceId, request.UserId, request.Limit, ct);
            categories.Add(new SearchCategoryResult
            {
                Category = "chats",
                Label = "Messages",
                TotalCount = items.Count,
                Items = items
            });
        }

        if (category is null or "users")
        {
            var items = await SearchUsers(tsQuery, request.WorkspaceId, request.Limit, ct);
            categories.Add(new SearchCategoryResult
            {
                Category = "users",
                Label = "People",
                TotalCount = items.Count,
                Items = items
            });
        }

        if (category is null or "files")
        {
            var items = await SearchFiles(tsQuery, request.WorkspaceId, request.Limit, ct);
            categories.Add(new SearchCategoryResult
            {
                Category = "files",
                Label = "Files",
                TotalCount = items.Count,
                Items = items
            });
        }

        sw.Stop();

        return new SearchResult
        {
            Query = query,
            TotalCount = categories.Sum(c => c.TotalCount),
            Categories = categories,
            ElapsedMs = sw.ElapsedMilliseconds
        };
    }

    private static string ToTsQuery(string query)
    {
        var sanitized = query
            .Replace("'", "''")
            .Replace("\\", "")
            .Trim();

        var words = sanitized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "''";

        return string.Join(" & ", words.Select(w => w + ":*"));
    }

    private static string SnippetHighlight(string content, int maxLen = 160)
    {
        if (string.IsNullOrEmpty(content)) return string.Empty;
        var clean = content.Replace("\n", " ").Replace("\r", "").Trim();
        if (clean.Length <= maxLen) return clean;
        return clean.Substring(0, maxLen) + "...";
    }

    private async Task<List<SearchItemResult>> SearchDocuments(string tsQuery, Guid workspaceId, int limit, CancellationToken ct)
    {
        var results = new List<SearchItemResult>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT d.\"Id\", d.\"Title\", d.\"Content\", d.\"CreatedAt\", " +
            "ts_rank_cd(to_tsvector('english', coalesce(d.\"Title\",'') || ' ' || coalesce(d.\"Content\",'')), plainto_tsquery('english', @q)) AS rank " +
            "FROM \"Documents\" d " +
            "WHERE d.\"WorkspaceId\" = @wid AND d.\"IsDeleted\" = false " +
            "AND to_tsvector('english', coalesce(d.\"Title\",'') || ' ' || coalesce(d.\"Content\",'')) @@ plainto_tsquery('english', @q) " +
            "ORDER BY rank DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@q", tsQuery);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            results.Add(new SearchItemResult
            {
                Id = reader.GetGuid(0),
                Title = reader.GetString(1),
                Subtitle = "Document",
                Snippet = SnippetHighlight(reader.GetString(2)),
                Url = "/documents/" + reader.GetGuid(0),
                Score = reader.GetDouble(4),
                Icon = "file-text",
                CreatedAt = reader.GetDateTime(3)
            });
        }

        return results;
    }

    private async Task<List<SearchItemResult>> SearchTasks(string tsQuery, Guid workspaceId, int limit, CancellationToken ct)
    {
        var results = new List<SearchItemResult>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT bc.\"Id\", bc.\"Title\", bc.\"Description\", bc.\"Priority\", bc.\"DueDate\", " +
            "bc.\"CreatedAt\", col.\"Name\" AS column_name, b.\"Name\" AS board_name, " +
            "ts_rank_cd(to_tsvector('english', coalesce(bc.\"Title\",'') || ' ' || coalesce(bc.\"Description\",'')), plainto_tsquery('english', @q)) AS rank " +
            "FROM \"BoardCards\" bc " +
            "INNER JOIN \"BoardColumns\" col ON bc.\"ColumnId\" = col.\"Id\" " +
            "INNER JOIN \"Boards\" b ON col.\"BoardId\" = b.\"Id\" " +
            "WHERE b.\"WorkspaceId\" = @wid AND b.\"IsDeleted\" = false " +
            "AND to_tsvector('english', coalesce(bc.\"Title\",'') || ' ' || coalesce(bc.\"Description\",'')) @@ plainto_tsquery('english', @q) " +
            "ORDER BY rank DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@q", tsQuery);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var boardName = reader.GetString(7);
            var columnName = reader.GetString(6);

            results.Add(new SearchItemResult
            {
                Id = reader.GetGuid(0),
                Title = reader.GetString(1),
                Subtitle = boardName + " / " + columnName,
                Snippet = reader.IsDBNull(2) ? null : SnippetHighlight(reader.GetString(2)),
                Url = null,
                Score = reader.GetDouble(8),
                Icon = "check-square",
                CreatedAt = reader.GetDateTime(5)
            });
        }

        return results;
    }

    private async Task<List<SearchItemResult>> SearchMessages(string tsQuery, Guid workspaceId, Guid userId, int limit, CancellationToken ct)
    {
        var results = new List<SearchItemResult>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT m.\"Id\", m.\"Content\", m.\"CreatedAt\", " +
            "u.\"FirstName\" || ' ' || u.\"LastName\" AS sender_name, " +
            "ch.\"Name\" AS channel_name, " +
            "ts_rank_cd(to_tsvector('english', m.\"Content\"), plainto_tsquery('english', @q)) AS rank " +
            "FROM \"Messages\" m " +
            "INNER JOIN \"Channels\" ch ON m.\"ChannelId\" = ch.\"Id\" " +
            "INNER JOIN \"Users\" u ON m.\"SenderId\" = u.\"Id\" " +
            "INNER JOIN \"ChannelMembers\" cm ON cm.\"ChannelId\" = ch.\"Id\" AND cm.\"UserId\" = @uid " +
            "WHERE ch.\"WorkspaceId\" = @wid " +
            "AND to_tsvector('english', m.\"Content\") @@ plainto_tsquery('english', @q) " +
            "ORDER BY rank DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@q", tsQuery);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@uid", userId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var senderName = reader.GetString(3);
            var channelName = reader.GetString(4);

            results.Add(new SearchItemResult
            {
                Id = reader.GetGuid(0),
                Title = "Message by " + senderName,
                Subtitle = "#" + channelName,
                Snippet = SnippetHighlight(reader.GetString(1)),
                Url = null,
                Score = reader.GetDouble(5),
                Icon = "message-square",
                CreatedAt = reader.GetDateTime(2)
            });
        }

        return results;
    }

    private async Task<List<SearchItemResult>> SearchUsers(string tsQuery, Guid workspaceId, int limit, CancellationToken ct)
    {
        var results = new List<SearchItemResult>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT u.\"Id\", u.\"FirstName\", u.\"LastName\", u.\"Email\", " +
            "ts_rank_cd(to_tsvector('english', u.\"FirstName\" || ' ' || u.\"LastName\" || ' ' || u.\"Email\"), plainto_tsquery('english', @q)) AS rank " +
            "FROM \"Users\" u " +
            "INNER JOIN \"WorkspaceMembers\" wm ON wm.\"UserId\" = u.\"Id\" " +
            "WHERE wm.\"WorkspaceId\" = @wid AND u.\"Status\" = 0 " +
            "AND to_tsvector('english', u.\"FirstName\" || ' ' || u.\"LastName\" || ' ' || u.\"Email\") @@ plainto_tsquery('english', @q) " +
            "ORDER BY rank DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@q", tsQuery);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var firstName = reader.GetString(1);
            var lastName = reader.GetString(2);

            results.Add(new SearchItemResult
            {
                Id = reader.GetGuid(0),
                Title = firstName + " " + lastName,
                Subtitle = reader.GetString(3),
                Snippet = null,
                Url = null,
                Score = reader.GetDouble(4),
                Icon = "user",
                CreatedAt = DateTime.MinValue
            });
        }

        return results;
    }

    private async Task<List<SearchItemResult>> SearchFiles(string tsQuery, Guid workspaceId, int limit, CancellationToken ct)
    {
        var results = new List<SearchItemResult>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        var sql = "SELECT df.\"Id\", df.\"OriginalFilename\", df.\"Description\", df.\"Tags\", " +
            "df.\"MimeType\", df.\"Size\", df.\"FileType\", df.\"CreatedAt\", " +
            "ts_rank_cd(to_tsvector('english', coalesce(df.\"OriginalFilename\",'') || ' ' || coalesce(df.\"Description\",'') || ' ' || coalesce(df.\"Tags\",'')), plainto_tsquery('english', @q)) AS rank " +
            "FROM \"DriveFiles\" df " +
            "WHERE df.\"WorkspaceId\" = @wid AND df.\"IsDeleted\" = false " +
            "AND to_tsvector('english', coalesce(df.\"OriginalFilename\",'') || ' ' || coalesce(df.\"Description\",'') || ' ' || coalesce(df.\"Tags\",'')) @@ plainto_tsquery('english', @q) " +
            "ORDER BY rank DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@q", tsQuery);
        cmd.Parameters.AddWithValue("@wid", workspaceId);
        cmd.Parameters.AddWithValue("@limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var filename = reader.GetString(1);
            var fileType = reader.GetString(6);
            var size = reader.GetInt64(5);

            results.Add(new SearchItemResult
            {
                Id = reader.GetGuid(0),
                Title = filename,
                Subtitle = fileType + " - " + FormatFileSize(size),
                Snippet = reader.IsDBNull(2) ? null : SnippetHighlight(reader.GetString(2)),
                Url = null,
                Score = reader.GetDouble(8),
                Icon = "file",
                CreatedAt = reader.GetDateTime(7)
            });
        }

        return results;
    }

    private static string FormatFileSize(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB"];
        double size = bytes;
        int unitIndex = 0;

        while (size >= 1024 && unitIndex < units.Length - 1)
        {
            size /= 1024;
            unitIndex++;
        }

        return size.ToString("F1") + " " + units[unitIndex];
    }
}
