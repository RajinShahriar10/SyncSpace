using FluentAssertions;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Domain.UnitTests.Entities;

public class WorkspaceTests
{
    [Fact]
    public void Workspace_ShouldInitializeCollections()
    {
        var workspace = new Workspace();

        workspace.Members.Should().BeEmpty();
        workspace.Documents.Should().BeEmpty();
        workspace.Boards.Should().BeEmpty();
        workspace.Channels.Should().BeEmpty();
    }

    [Fact]
    public void Workspace_ShouldSetProperties()
    {
        var id = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var workspace = new Workspace
        {
            Id = id,
            Name = "My Workspace",
            Slug = "my-workspace",
            Description = "A test workspace",
            IconUrl = "https://example.com/icon.png",
            OwnerId = ownerId,
            Plan = "pro"
        };

        workspace.Id.Should().Be(id);
        workspace.Name.Should().Be("My Workspace");
        workspace.Slug.Should().Be("my-workspace");
        workspace.Description.Should().Be("A test workspace");
        workspace.IconUrl.Should().Be("https://example.com/icon.png");
        workspace.OwnerId.Should().Be(ownerId);
        workspace.Plan.Should().Be("pro");
        workspace.IsDeleted.Should().BeFalse();
        workspace.DeletedAt.Should().BeNull();
        workspace.DeletedBy.Should().BeNull();
    }
}
