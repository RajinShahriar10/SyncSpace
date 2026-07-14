namespace SyncSpace.Domain.Entities;

using SyncSpace.Domain.Common;

public class Attachment : BaseEntity
{
    public string Filename { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long Size { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public Guid MessageId { get; set; }

    public Message Message { get; set; } = null!;
}
