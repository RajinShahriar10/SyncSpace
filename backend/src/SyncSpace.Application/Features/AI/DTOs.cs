namespace SyncSpace.Application.Features.AI.DTOs;

public class AIRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string? Context { get; set; }
    public string? DocumentId { get; set; }
}

public class AIResponse
{
    public string Content { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
}

public class SummarizeRequest
{
    public string Content { get; set; } = string.Empty;
    public string Style { get; set; } = "concise";
}

public class MeetingNotesRequest
{
    public string Content { get; set; } = string.Empty;
}

public class RewriteRequest
{
    public string Content { get; set; } = string.Empty;
    public string Tone { get; set; } = "professional";
}

public class TaskListRequest
{
    public string Content { get; set; } = string.Empty;
}

public class ActionItemsRequest
{
    public string Content { get; set; } = string.Empty;
}
