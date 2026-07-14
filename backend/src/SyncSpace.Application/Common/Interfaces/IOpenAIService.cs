using SyncSpace.Application.Features.AI.DTOs;

namespace SyncSpace.Application.Common.Interfaces;

public interface IOpenAIService
{
    Task<AIResponse> SummarizeAsync(SummarizeRequest request, CancellationToken ct = default);
    Task<AIResponse> GenerateMeetingNotesAsync(MeetingNotesRequest request, CancellationToken ct = default);
    Task<AIResponse> RewriteAsync(RewriteRequest request, CancellationToken ct = default);
    Task<AIResponse> CreateTaskListAsync(TaskListRequest request, CancellationToken ct = default);
    Task<AIResponse> ExtractActionItemsAsync(ActionItemsRequest request, CancellationToken ct = default);
    Task<AIResponse> ChatAsync(string systemPrompt, string userMessage, CancellationToken ct = default);
}
