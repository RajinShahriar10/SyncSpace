using FluentAssertions;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Domain.UnitTests.Entities;

public class DriveFileTests
{
    [Fact]
    public void DriveFile_ShouldDefaultFileTypeToOther()
    {
        var file = new DriveFile();

        file.FileType.Should().Be(FileType.Other);
    }

    [Fact]
    public void DriveFile_ShouldDefaultIsDeletedToFalse()
    {
        var file = new DriveFile();

        file.IsDeleted.Should().BeFalse();
        file.DeletedAt.Should().BeNull();
    }

    [Fact]
    public void DriveFile_ShouldSetAllProperties()
    {
        var workspaceId = Guid.NewGuid();
        var uploadedById = Guid.NewGuid();
        var file = new DriveFile
        {
            OriginalFilename = "report.pdf",
            StorageFilename = "abc123.pdf",
            Url = "https://storage.example.com/abc123.pdf",
            ThumbnailUrl = "https://storage.example.com/abc123_thumb.png",
            MimeType = "application/pdf",
            Size = 2048,
            FileType = FileType.Pdf,
            FolderPath = "/documents/reports",
            WorkspaceId = workspaceId,
            UploadedById = uploadedById,
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow,
            Description = "Annual report",
            Tags = "report,annual"
        };

        file.OriginalFilename.Should().Be("report.pdf");
        file.StorageFilename.Should().Be("abc123.pdf");
        file.Url.Should().Be("https://storage.example.com/abc123.pdf");
        file.ThumbnailUrl.Should().Be("https://storage.example.com/abc123_thumb.png");
        file.MimeType.Should().Be("application/pdf");
        file.Size.Should().Be(2048);
        file.FileType.Should().Be(FileType.Pdf);
        file.FolderPath.Should().Be("/documents/reports");
        file.WorkspaceId.Should().Be(workspaceId);
        file.UploadedById.Should().Be(uploadedById);
        file.IsDeleted.Should().BeTrue();
        file.DeletedAt.Should().NotBeNull();
        file.Description.Should().Be("Annual report");
        file.Tags.Should().Be("report,annual");
    }

    [Fact]
    public void DriveFolder_ShouldDefaultPath()
    {
        var folder = new DriveFolder();

        folder.Path.Should().Be("/");
        folder.ParentPath.Should().BeNull();
        folder.Name.Should().BeEmpty();
    }
}
