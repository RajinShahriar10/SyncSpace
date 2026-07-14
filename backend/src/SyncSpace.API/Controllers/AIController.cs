using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Application.Features.AI.DTOs;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IOpenAIService _aiService;

    public AIController(IOpenAIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("summarize")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Summarize([FromBody] SummarizeRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { success = false, message = "Content is required" });

        var result = await _aiService.SummarizeAsync(request, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("meeting-notes")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> MeetingNotes([FromBody] MeetingNotesRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { success = false, message = "Content is required" });

        var result = await _aiService.GenerateMeetingNotesAsync(request, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("rewrite")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Rewrite([FromBody] RewriteRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { success = false, message = "Content is required" });

        var result = await _aiService.RewriteAsync(request, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("tasks")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateTaskList([FromBody] TaskListRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { success = false, message = "Content is required" });

        var result = await _aiService.CreateTaskListAsync(request, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("action-items")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExtractActionItems([FromBody] ActionItemsRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { success = false, message = "Content is required" });

        var result = await _aiService.ExtractActionItemsAsync(request, ct);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("chat")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Chat([FromBody] AIRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return BadRequest(new { success = false, message = "Prompt is required" });

        var systemPrompt = !string.IsNullOrEmpty(request.Context)
            ? $"You are a helpful AI writing assistant. Context from the current document:\n\n{request.Context}\n\nAnswer questions and help with writing tasks based on this context."
            : "You are a helpful AI writing assistant. Help users with writing, editing, brainstorming, and content creation tasks.";

        var result = await _aiService.ChatAsync(systemPrompt, request.Prompt, ct);
        return Ok(new { success = true, data = result });
    }
}
