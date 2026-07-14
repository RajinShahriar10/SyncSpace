using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SyncSpace.Application.Common.Models;
using SyncSpace.Application.Features.Chat.DTOs;
using SyncSpace.Application.Features.Chat.Commands;
using SyncSpace.Application.Features.Chat.Queries;

namespace SyncSpace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // --- Channels ---

    [HttpGet("workspaces/{workspaceId:guid}/channels")]
    [ProducesResponseType(typeof(ApiResponse<List<ChannelDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkspaceChannels(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetWorkspaceChannelsQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }

    [HttpGet("channels/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ChannelDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChannel(Guid id)
    {
        var result = await _mediator.Send(new GetChannelQuery { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("channels")]
    [ProducesResponseType(typeof(ApiResponse<ChannelDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateChannel([FromBody] CreateChannelCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success
            ? CreatedAtAction(nameof(GetChannel), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    [HttpPut("channels/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ChannelDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateChannel(Guid id, [FromBody] UpdateChannelCommand command)
    {
        var result = await _mediator.Send(command with { Id = id });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("channels/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteChannel(Guid id)
    {
        var result = await _mediator.Send(new DeleteChannelCommand { Id = id });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("channels/{channelId:guid}/join")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> JoinChannel(Guid channelId)
    {
        var result = await _mediator.Send(new JoinChannelCommand { ChannelId = channelId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("channels/{channelId:guid}/leave")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LeaveChannel(Guid channelId)
    {
        var result = await _mediator.Send(new LeaveChannelCommand { ChannelId = channelId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    // --- Messages ---

    [HttpGet("channels/{channelId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChannelMessages(Guid channelId, [FromQuery] int limit = 50, [FromQuery] Guid? before = null)
    {
        var result = await _mediator.Send(new GetChannelMessagesQuery { ChannelId = channelId, Limit = limit, Before = before });
        return Ok(result);
    }

    [HttpPost("channels/{channelId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage(Guid channelId, [FromBody] SendMessageCommand command)
    {
        var result = await _mediator.Send(command with { ChannelId = channelId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("messages/{messageId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EditMessage(Guid messageId, [FromBody] EditMessageCommand command)
    {
        var result = await _mediator.Send(command with { MessageId = messageId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("messages/{messageId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteMessage(Guid messageId)
    {
        var result = await _mediator.Send(new DeleteMessageCommand { MessageId = messageId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("messages/{messageId:guid}/pin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PinMessage(Guid messageId, [FromQuery] bool pinned = true)
    {
        var result = await _mediator.Send(new PinMessageCommand { MessageId = messageId, IsPinned = pinned });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("channels/{channelId:guid}/pinned")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPinnedMessages(Guid channelId)
    {
        var result = await _mediator.Send(new GetChannelPinnedMessagesQuery { ChannelId = channelId });
        return Ok(result);
    }

    [HttpGet("channels/{channelId:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<List<ChatMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChannelMembers(Guid channelId)
    {
        var result = await _mediator.Send(new GetChannelMembersQuery { ChannelId = channelId });
        return Ok(result);
    }

    // --- Reactions ---

    [HttpPost("messages/{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<ReactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddReaction(Guid messageId, [FromBody] AddReactionCommand command)
    {
        var result = await _mediator.Send(command with { MessageId = messageId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("messages/{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveReaction(Guid messageId, [FromQuery] string emoji)
    {
        var result = await _mediator.Send(new RemoveReactionCommand { MessageId = messageId, Emoji = emoji });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("channels/{channelId:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(Guid channelId)
    {
        var result = await _mediator.Send(new MarkAsReadCommand { ChannelId = channelId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // --- Direct Messages ---

    [HttpGet("workspaces/{workspaceId:guid}/conversations")]
    [ProducesResponseType(typeof(ApiResponse<List<ConversationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(Guid workspaceId)
    {
        var result = await _mediator.Send(new GetConversationsQuery { WorkspaceId = workspaceId });
        return Ok(result);
    }

    [HttpPost("workspaces/{workspaceId:guid}/conversations")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrCreateConversation(Guid workspaceId, [FromBody] GetOrCreateConversationQuery command)
    {
        var result = await _mediator.Send(command with { WorkspaceId = workspaceId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<List<DirectMessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDirectMessages(Guid conversationId, [FromQuery] int limit = 50)
    {
        var result = await _mediator.Send(new GetDirectMessagesQuery { ConversationId = conversationId, Limit = limit });
        return Ok(result);
    }

    [HttpPost("conversations/{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<DirectMessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendDirectMessage(Guid conversationId, [FromBody] SendDirectMessageCommand command)
    {
        var result = await _mediator.Send(command with { ConversationId = conversationId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("dm/{messageId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DirectMessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EditDirectMessage(Guid messageId, [FromBody] EditDirectMessageCommand command)
    {
        var result = await _mediator.Send(command with { MessageId = messageId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("dm/{messageId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteDirectMessage(Guid messageId)
    {
        var result = await _mediator.Send(new DeleteDirectMessageCommand { MessageId = messageId });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("dm/{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<DmReactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddDmReaction(Guid messageId, [FromBody] AddDmReactionCommand command)
    {
        var result = await _mediator.Send(command with { MessageId = messageId });
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("dm/{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveDmReaction(Guid messageId, [FromQuery] string emoji)
    {
        var result = await _mediator.Send(new RemoveDmReactionCommand { MessageId = messageId, Emoji = emoji });
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("conversations/{conversationId:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkDmRead(Guid conversationId)
    {
        var result = await _mediator.Send(new MarkDmReadCommand { ConversationId = conversationId });
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
