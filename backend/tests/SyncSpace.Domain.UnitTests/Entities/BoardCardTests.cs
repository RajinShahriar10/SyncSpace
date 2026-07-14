using FluentAssertions;
using SyncSpace.Domain.Entities;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.UnitTests.Entities;

public class BoardCardTests
{
    [Fact]
    public void BoardCard_ShouldDefaultPriorityToNone()
    {
        var card = new BoardCard();

        card.Priority.Should().Be(CardPriority.None);
        card.Title.Should().BeEmpty();
        card.Description.Should().BeNull();
        card.ColumnId.Should().Be(Guid.Empty);
        card.Order.Should().Be(0);
        card.AssigneeId.Should().BeNull();
        card.DueDate.Should().BeNull();
    }

    [Fact]
    public void BoardCard_ShouldInitializeCollections()
    {
        var card = new BoardCard();

        card.Labels.Should().BeEmpty();
        card.Comments.Should().BeEmpty();
        card.Attachments.Should().BeEmpty();
    }

    [Fact]
    public void BoardCardComment_ShouldSetProperties()
    {
        var cardId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var comment = new BoardCardComment
        {
            CardId = cardId,
            UserId = userId,
            Content = "Test comment"
        };

        comment.CardId.Should().Be(cardId);
        comment.UserId.Should().Be(userId);
        comment.Content.Should().Be("Test comment");
    }

    [Fact]
    public void BoardCardAttachment_ShouldSetProperties()
    {
        var cardId = Guid.NewGuid();
        var uploadedById = Guid.NewGuid();
        var attachment = new BoardCardAttachment
        {
            CardId = cardId,
            Filename = "document.pdf",
            Url = "https://example.com/doc.pdf",
            Size = 1024,
            MimeType = "application/pdf",
            UploadedById = uploadedById
        };

        attachment.CardId.Should().Be(cardId);
        attachment.Filename.Should().Be("document.pdf");
        attachment.Url.Should().Be("https://example.com/doc.pdf");
        attachment.Size.Should().Be(1024);
        attachment.MimeType.Should().Be("application/pdf");
        attachment.UploadedById.Should().Be(uploadedById);
    }

    [Fact]
    public void BoardActivity_ShouldSetProperties()
    {
        var boardId = Guid.NewGuid();
        var cardId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var activity = new BoardActivity
        {
            BoardId = boardId,
            CardId = cardId,
            UserId = userId,
            ActivityType = ActivityType.CommentAdded,
            Description = "Comment was added",
            OldValue = "old",
            NewValue = "new"
        };

        activity.BoardId.Should().Be(boardId);
        activity.CardId.Should().Be(cardId);
        activity.UserId.Should().Be(userId);
        activity.ActivityType.Should().Be(ActivityType.CommentAdded);
        activity.Description.Should().Be("Comment was added");
        activity.OldValue.Should().Be("old");
        activity.NewValue.Should().Be("new");
    }
}
