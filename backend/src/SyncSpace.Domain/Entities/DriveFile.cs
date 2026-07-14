namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public enum FileType
{
    Image,
    Pdf,
    Document,
    Spreadsheet,
    Presentation,
    Video,
    Audio,
    Archive,
    Other
}

public class DriveFile : BaseEntity
{
    public string OriginalFilename { get; set; } = string.Empty;
    public string StorageFilename { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public long Size { get; set; }
    public FileType FileType { get; set; } = FileType.Other;
    public string? FolderPath { get; set; } = "/";
    public Guid WorkspaceId { get; set; }
    public Guid UploadedById { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User UploadedBy { get; set; } = null!;
}

public class DriveFolder : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = "/";
    public string? ParentPath { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid CreatedById { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
