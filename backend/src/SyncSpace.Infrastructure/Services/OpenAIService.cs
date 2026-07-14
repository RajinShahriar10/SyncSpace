using Microsoft.Extensions.Configuration;
using OpenAI;
using OpenAI.Chat;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.AI.DTOs;

namespace SyncSpace.Infrastructure.Services;

public class OpenAIService : IOpenAIService
{
    private readonly string _apiKey;
    private readonly string _model;

    public OpenAIService(IConfiguration configuration)
    {
        _apiKey = configuration["OpenAI:ApiKey"]
            ?? throw new InvalidOperationException("OpenAI API key not configured");
        _model = configuration["OpenAI:Model"] ?? "gpt-4o";
    }

    private OpenAIClient CreateClient() => new(_apiKey);

    private static ChatMessage SystemMessage(string content) =>
        ChatMessage.CreateSystemMessage(content);

    private static ChatMessage UserMessage(string content) =>
        ChatMessage.CreateUserMessage(content);

    private async Task<AIResponse> CompleteAsync(List<ChatMessage> messages, CancellationToken ct)
    {
        var client = CreateClient();
        var chatClient = client.GetChatClient(_model);
        var response = await chatClient.CompleteChatAsync(messages, cancellationToken: ct);

        var content = response.Value.Content[0].Text;
        var inputTokens = response.Value.Usage.InputTokenCount;
        var outputTokens = response.Value.Usage.OutputTokenCount;

        return new AIResponse
        {
            Content = content,
            Model = _model,
            TokensUsed = inputTokens + outputTokens
        };
    }

    public async Task<AIResponse> SummarizeAsync(SummarizeRequest request, CancellationToken ct = default)
    {
        var styleInstruction = request.Style.ToLowerInvariant() switch
        {
            "detailed" => "Provide a detailed, comprehensive summary covering all key points.",
            "brief" => "Provide a very brief 1-2 sentence summary.",
            "bullet" => "Provide the summary as organized bullet points.",
            _ => "Provide a concise, well-structured summary."
        };

        var messages = new List<ChatMessage>
        {
            SystemMessage($"You are a professional document summarizer. {styleInstruction} Use clear, professional language. Output in markdown format."),
            UserMessage($"Summarize the following content:\n\n{request.Content}")
        };

        return await CompleteAsync(messages, ct);
    }

    public async Task<AIResponse> GenerateMeetingNotesAsync(MeetingNotesRequest request, CancellationToken ct = default)
    {
        var messages = new List<ChatMessage>
        {
            SystemMessage("You are a professional meeting notes assistant. Generate well-structured meeting notes in markdown format with sections: Attendees (if mentioned), Agenda Items Discussed, Key Decisions, Action Items, and Next Steps. Be concise but thorough."),
            UserMessage($"Generate meeting notes from the following content:\n\n{request.Content}")
        };

        return await CompleteAsync(messages, ct);
    }

    public async Task<AIResponse> RewriteAsync(RewriteRequest request, CancellationToken ct = default)
    {
        var toneInstruction = request.Tone.ToLowerInvariant() switch
        {
            "casual" => "Rewrite in a casual, conversational tone.",
            "formal" => "Rewrite in a highly formal, academic tone.",
            "simple" => "Rewrite using simple, easy-to-understand language suitable for a general audience.",
            "technical" => "Rewrite in a precise, technical tone with appropriate terminology.",
            _ => "Rewrite in a professional, clear tone suitable for a business context."
        };

        var messages = new List<ChatMessage>
        {
            SystemMessage($"You are a professional content editor. {toneInstruction} Preserve the original meaning while improving clarity and flow. Output in markdown."),
            UserMessage($"Rewrite the following content:\n\n{request.Content}")
        };

        return await CompleteAsync(messages, ct);
    }

    public async Task<AIResponse> CreateTaskListAsync(TaskListRequest request, CancellationToken ct = default)
    {
        var messages = new List<ChatMessage>
        {
            SystemMessage("You are a project management assistant. Extract or create a structured task list from the given content. Format as markdown with: - Task title (in bold) - Brief description - Priority level (High/Medium/Low) if inferable. Organize by priority when possible."),
            UserMessage($"Create a task list from the following content:\n\n{request.Content}")
        };

        return await CompleteAsync(messages, ct);
    }

    public async Task<AIResponse> ExtractActionItemsAsync(ActionItemsRequest request, CancellationToken ct = default)
    {
        var messages = new List<ChatMessage>
        {
            SystemMessage("You are a productivity assistant. Extract clear, actionable items from the given content. Format as a markdown checklist with: - [ ] Action item description - Owner/assignee (if mentioned) - Suggested deadline (if inferable). Be specific and actionable."),
            UserMessage($"Extract action items from the following content:\n\n{request.Content}")
        };

        return await CompleteAsync(messages, ct);
    }

    public async Task<AIResponse> ChatAsync(string systemPrompt, string userMessage, CancellationToken ct = default)
    {
        var messages = new List<ChatMessage>
        {
            SystemMessage(systemPrompt),
            UserMessage(userMessage)
        };

        return await CompleteAsync(messages, ct);
    }
}
