using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SyncSpace.Domain.Entities;

namespace SyncSpace.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.IdentityId).IsRequired().HasMaxLength(450);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.AvatarUrl).HasMaxLength(500);
        builder.Property(u => u.Bio).HasMaxLength(1000);
        builder.HasIndex(u => u.IdentityId).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.Status);
        builder.HasIndex(u => u.CreatedAt);
    }
}

public class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Name).IsRequired().HasMaxLength(200);
        builder.Property(w => w.Slug).IsRequired().HasMaxLength(200);
        builder.Property(w => w.Description).HasMaxLength(1000);
        builder.Property(w => w.IconUrl).HasMaxLength(500);
        builder.Property(w => w.Plan).IsRequired().HasMaxLength(50);
        builder.HasIndex(w => w.Slug).IsUnique();
        builder.HasOne(w => w.Owner).WithMany().HasForeignKey(w => w.OwnerId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class WorkspaceMemberConfiguration : IEntityTypeConfiguration<WorkspaceMember>
{
    public void Configure(EntityTypeBuilder<WorkspaceMember> builder)
    {
        builder.HasKey(wm => wm.Id);
        builder.HasOne(wm => wm.User).WithMany(u => u.WorkspaceMembers).HasForeignKey(wm => wm.UserId);
        builder.HasOne(wm => wm.Workspace).WithMany(w => w.Members).HasForeignKey(wm => wm.WorkspaceId);
        builder.HasIndex(wm => new { wm.UserId, wm.WorkspaceId }).IsUnique();
        builder.HasIndex(wm => wm.WorkspaceId);
    }
}

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Title).IsRequired().HasMaxLength(500);
        builder.Property(d => d.Content).HasColumnType("text");
        builder.Property(d => d.FolderPath).HasMaxLength(500);
        builder.HasOne(d => d.Workspace).WithMany(w => w.Documents).HasForeignKey(d => d.WorkspaceId);
        builder.HasOne(d => d.Author).WithMany(u => u.Documents).HasForeignKey(d => d.AuthorId);
        builder.HasIndex(d => d.WorkspaceId);
        builder.HasIndex(d => d.AuthorId);
        builder.HasIndex(d => d.IsDeleted);
        builder.HasIndex(d => new { d.WorkspaceId, d.IsDeleted });
        builder.HasIndex(d => new { d.WorkspaceId, d.UpdatedAt });
        builder.HasIndex(d => d.CreatedAt);
    }
}

public class BoardConfiguration : IEntityTypeConfiguration<Board>
{
    public void Configure(EntityTypeBuilder<Board> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Description).HasMaxLength(1000);
        builder.HasOne(b => b.Workspace).WithMany(w => w.Boards).HasForeignKey(b => b.WorkspaceId);
        builder.HasOne(b => b.Author).WithMany().HasForeignKey(b => b.AuthorId);
        builder.HasIndex(b => b.WorkspaceId);
        builder.HasIndex(b => b.IsDeleted);
        builder.HasIndex(b => new { b.WorkspaceId, b.IsDeleted });
    }
}

public class BoardColumnConfiguration : IEntityTypeConfiguration<BoardColumn>
{
    public void Configure(EntityTypeBuilder<BoardColumn> builder)
    {
        builder.HasKey(bc => bc.Id);
        builder.Property(bc => bc.Name).IsRequired().HasMaxLength(100);
        builder.Property(bc => bc.Color).HasMaxLength(7);
        builder.HasOne(bc => bc.Board).WithMany(b => b.Columns).HasForeignKey(bc => bc.BoardId);
        builder.HasIndex(bc => bc.BoardId);
    }
}

public class BoardCardConfiguration : IEntityTypeConfiguration<BoardCard>
{
    public void Configure(EntityTypeBuilder<BoardCard> builder)
    {
        builder.HasKey(bc => bc.Id);
        builder.Property(bc => bc.Title).IsRequired().HasMaxLength(500);
        builder.Property(bc => bc.Description).HasColumnType("text");
        builder.Property(bc => bc.Priority).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(bc => bc.Column).WithMany(c => c.Cards).HasForeignKey(bc => bc.ColumnId);
        builder.HasOne(bc => bc.Assignee).WithMany().HasForeignKey(bc => bc.AssigneeId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(bc => bc.ColumnId);
        builder.HasIndex(bc => bc.AssigneeId);
        builder.HasIndex(bc => new { bc.ColumnId, bc.CreatedAt });
        builder.HasIndex(bc => new { bc.ColumnId, bc.Priority });
    }
}

public class BoardCardCommentConfiguration : IEntityTypeConfiguration<BoardCardComment>
{
    public void Configure(EntityTypeBuilder<BoardCardComment> builder)
    {
        builder.HasKey(bcc => bcc.Id);
        builder.Property(bcc => bcc.Content).IsRequired().HasColumnType("text");
        builder.HasOne(bcc => bcc.Card).WithMany(c => c.Comments).HasForeignKey(bcc => bcc.CardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(bcc => bcc.User).WithMany().HasForeignKey(bcc => bcc.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class BoardCardAttachmentConfiguration : IEntityTypeConfiguration<BoardCardAttachment>
{
    public void Configure(EntityTypeBuilder<BoardCardAttachment> builder)
    {
        builder.HasKey(bca => bca.Id);
        builder.Property(bca => bca.Filename).IsRequired().HasMaxLength(500);
        builder.Property(bca => bca.Url).IsRequired().HasMaxLength(2000);
        builder.Property(bca => bca.MimeType).IsRequired().HasMaxLength(100);
        builder.HasOne(bca => bca.Card).WithMany(c => c.Attachments).HasForeignKey(bca => bca.CardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(bca => bca.UploadedBy).WithMany().HasForeignKey(bca => bca.UploadedById).OnDelete(DeleteBehavior.Restrict);
    }
}

public class BoardActivityConfiguration : IEntityTypeConfiguration<BoardActivity>
{
    public void Configure(EntityTypeBuilder<BoardActivity> builder)
    {
        builder.HasKey(ba => ba.Id);
        builder.Property(ba => ba.Description).IsRequired().HasMaxLength(1000);
        builder.Property(ba => ba.OldValue).HasMaxLength(500);
        builder.Property(ba => ba.NewValue).HasMaxLength(500);
        builder.Property(ba => ba.ActivityType).HasConversion<string>().HasMaxLength(30);
        builder.HasOne(ba => ba.Board).WithMany().HasForeignKey(ba => ba.BoardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(ba => ba.Card).WithMany().HasForeignKey(ba => ba.CardId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(ba => ba.User).WithMany().HasForeignKey(ba => ba.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(ba => new { ba.BoardId, ba.CreatedAt });
    }
}

public class CardLabelConfiguration : IEntityTypeConfiguration<CardLabel>
{
    public void Configure(EntityTypeBuilder<CardLabel> builder)
    {
        builder.HasKey(cl => cl.Id);
        builder.HasOne(cl => cl.Card).WithMany(c => c.Labels).HasForeignKey(cl => cl.CardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(cl => cl.Label).WithMany(l => l.CardLabels).HasForeignKey(cl => cl.LabelId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(cl => new { cl.CardId, cl.LabelId }).IsUnique();
    }
}

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Name).IsRequired().HasMaxLength(100);
        builder.Property(l => l.Color).IsRequired().HasMaxLength(7);
        builder.HasOne(l => l.Workspace).WithMany().HasForeignKey(l => l.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ChannelConfiguration : IEntityTypeConfiguration<Channel>
{
    public void Configure(EntityTypeBuilder<Channel> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);
        builder.HasOne(c => c.Workspace).WithMany(w => w.Channels).HasForeignKey(c => c.WorkspaceId);
        builder.HasOne(c => c.CreatedBy).WithMany().HasForeignKey(c => c.CreatedById).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(c => new { c.WorkspaceId, c.Name }).IsUnique();
    }
}

public class ChannelMemberConfiguration : IEntityTypeConfiguration<ChannelMember>
{
    public void Configure(EntityTypeBuilder<ChannelMember> builder)
    {
        builder.HasKey(cm => cm.Id);
        builder.Property(cm => cm.Role).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(cm => cm.Channel).WithMany(c => c.Members).HasForeignKey(cm => cm.ChannelId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(cm => cm.User).WithMany().HasForeignKey(cm => cm.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(cm => new { cm.ChannelId, cm.UserId }).IsUnique();
        builder.HasIndex(cm => cm.UserId);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Content).IsRequired().HasColumnType("text");
        builder.Property(m => m.Type).HasConversion<string>().HasMaxLength(20);
        builder.HasOne(m => m.Channel).WithMany(c => c.Messages).HasForeignKey(m => m.ChannelId);
        builder.HasOne(m => m.Sender).WithMany(u => u.Messages).HasForeignKey(m => m.SenderId);
        builder.HasOne(m => m.Thread).WithMany(m => m.Replies).HasForeignKey(m => m.ThreadId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.PinnedBy).WithMany().HasForeignKey(m => m.PinnedById).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(m => new { m.ChannelId, m.CreatedAt });
        builder.HasIndex(m => m.ThreadId);
        builder.HasIndex(m => m.SenderId);
        builder.HasIndex(m => m.CreatedAt);
    }
}

public class MessageReadReceiptConfiguration : IEntityTypeConfiguration<MessageReadReceipt>
{
    public void Configure(EntityTypeBuilder<MessageReadReceipt> builder)
    {
        builder.HasKey(rr => rr.Id);
        builder.HasOne(rr => rr.Message).WithMany(m => m.ReadReceipts).HasForeignKey(rr => rr.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(rr => rr.User).WithMany().HasForeignKey(rr => rr.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(rr => new { rr.MessageId, rr.UserId }).IsUnique();
    }
}

public class MessageEditConfiguration : IEntityTypeConfiguration<MessageEdit>
{
    public void Configure(EntityTypeBuilder<MessageEdit> builder)
    {
        builder.HasKey(me => me.Id);
        builder.Property(me => me.OldContent).IsRequired().HasColumnType("text");
        builder.Property(me => me.NewContent).IsRequired().HasColumnType("text");
        builder.HasOne(me => me.Message).WithMany(m => m.EditHistory).HasForeignKey(me => me.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(me => me.EditedBy).WithMany().HasForeignKey(me => me.EditedById).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(me => me.MessageId);
    }
}

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Emoji).IsRequired().HasMaxLength(10);
        builder.HasOne(r => r.Message).WithMany(m => m.Reactions).HasForeignKey(r => r.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(r => new { r.MessageId, r.UserId, r.Emoji }).IsUnique();
    }
}

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.HasKey(c => c.Id);
        builder.HasOne(c => c.Workspace).WithMany().HasForeignKey(c => c.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(c => c.User1).WithMany().HasForeignKey(c => c.User1Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.User2).WithMany().HasForeignKey(c => c.User2Id).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(c => new { c.User1Id, c.User2Id }).IsUnique();
        builder.HasIndex(c => c.LastMessageAt);
    }
}

public class DirectMessageConfiguration : IEntityTypeConfiguration<DirectMessage>
{
    public void Configure(EntityTypeBuilder<DirectMessage> builder)
    {
        builder.HasKey(dm => dm.Id);
        builder.Property(dm => dm.Content).IsRequired().HasColumnType("text");
        builder.HasOne(dm => dm.Conversation).WithMany(c => c.Messages).HasForeignKey(dm => dm.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(dm => dm.Sender).WithMany().HasForeignKey(dm => dm.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(dm => dm.ReplyTo).WithMany().HasForeignKey(dm => dm.ReplyToId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(dm => new { dm.ConversationId, dm.CreatedAt });
    }
}

public class DirectMessageReactionConfiguration : IEntityTypeConfiguration<DirectMessageReaction>
{
    public void Configure(EntityTypeBuilder<DirectMessageReaction> builder)
    {
        builder.HasKey(dmr => dmr.Id);
        builder.Property(dmr => dmr.Emoji).IsRequired().HasMaxLength(10);
        builder.HasOne(dmr => dmr.Message).WithMany(m => m.Reactions).HasForeignKey(dmr => dmr.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(dmr => dmr.User).WithMany().HasForeignKey(dmr => dmr.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(dmr => new { dmr.MessageId, dmr.UserId, dmr.Emoji }).IsUnique();
    }
}

public class DirectMessageReadReceiptConfiguration : IEntityTypeConfiguration<DirectMessageReadReceipt>
{
    public void Configure(EntityTypeBuilder<DirectMessageReadReceipt> builder)
    {
        builder.HasKey(drr => drr.Id);
        builder.HasOne(drr => drr.Message).WithMany(m => m.ReadReceipts).HasForeignKey(drr => drr.MessageId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(drr => drr.User).WithMany().HasForeignKey(drr => drr.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(drr => new { drr.MessageId, drr.UserId }).IsUnique();
    }
}

public class DocumentVersionConfiguration : IEntityTypeConfiguration<DocumentVersion>
{
    public void Configure(EntityTypeBuilder<DocumentVersion> builder)
    {
        builder.HasKey(dv => dv.Id);
        builder.Property(dv => dv.Content).HasColumnType("text");
        builder.Property(dv => dv.Title).HasMaxLength(500);
        builder.Property(dv => dv.AuthorName).HasMaxLength(200);
        builder.Property(dv => dv.ChangeDescription).HasMaxLength(500);
        builder.HasOne(dv => dv.Document).WithMany().HasForeignKey(dv => dv.DocumentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(dv => new { dv.DocumentId, dv.VersionNumber });
    }
}

public class DocumentCommentConfiguration : IEntityTypeConfiguration<DocumentComment>
{
    public void Configure(EntityTypeBuilder<DocumentComment> builder)
    {
        builder.HasKey(dc => dc.Id);
        builder.Property(dc => dc.Content).IsRequired().HasColumnType("text");
        builder.Property(dc => dc.SelectedText).HasMaxLength(1000);
        builder.HasOne(dc => dc.Document).WithMany().HasForeignKey(dc => dc.DocumentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(dc => dc.User).WithMany().HasForeignKey(dc => dc.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(dc => dc.ParentComment).WithMany(c => c.Replies).HasForeignKey(dc => dc.ParentCommentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(dc => dc.DocumentId);
    }
}

public class DocumentCommentReactionConfiguration : IEntityTypeConfiguration<DocumentCommentReaction>
{
    public void Configure(EntityTypeBuilder<DocumentCommentReaction> builder)
    {
        builder.HasKey(dcr => dcr.Id);
        builder.Property(dcr => dcr.Emoji).IsRequired().HasMaxLength(10);
        builder.HasOne(dcr => dcr.Comment).WithMany(c => c.Reactions).HasForeignKey(dcr => dcr.CommentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(dcr => dcr.User).WithMany().HasForeignKey(dcr => dcr.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(dcr => new { dcr.CommentId, dcr.UserId, dcr.Emoji }).IsUnique();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Message).IsRequired().HasMaxLength(1000);
        builder.Property(n => n.ActionUrl).HasMaxLength(500);
        builder.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId);
        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => n.IsRead);
        builder.HasIndex(n => new { n.UserId, n.IsRead });
        builder.HasIndex(n => new { n.UserId, n.CreatedAt });
    }
}

public class DriveFileConfiguration : IEntityTypeConfiguration<DriveFile>
{
    public void Configure(EntityTypeBuilder<DriveFile> builder)
    {
        builder.HasKey(df => df.Id);
        builder.Property(df => df.OriginalFilename).IsRequired().HasMaxLength(500);
        builder.Property(df => df.StorageFilename).IsRequired().HasMaxLength(500);
        builder.Property(df => df.Url).IsRequired().HasMaxLength(2000);
        builder.Property(df => df.ThumbnailUrl).HasMaxLength(2000);
        builder.Property(df => df.MimeType).IsRequired().HasMaxLength(100);
        builder.Property(df => df.FileType).HasConversion<string>().HasMaxLength(20);
        builder.Property(df => df.FolderPath).HasMaxLength(500);
        builder.Property(df => df.Description).HasMaxLength(1000);
        builder.Property(df => df.Tags).HasMaxLength(500);
        builder.HasOne(df => df.Workspace).WithMany().HasForeignKey(df => df.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(df => df.UploadedBy).WithMany().HasForeignKey(df => df.UploadedById).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(df => new { df.WorkspaceId, df.FolderPath });
        builder.HasIndex(df => df.IsDeleted);
        builder.HasIndex(df => df.CreatedAt);
    }
}

public class DriveFolderConfiguration : IEntityTypeConfiguration<DriveFolder>
{
    public void Configure(EntityTypeBuilder<DriveFolder> builder)
    {
        builder.HasKey(df => df.Id);
        builder.Property(df => df.Name).IsRequired().HasMaxLength(200);
        builder.Property(df => df.Path).IsRequired().HasMaxLength(500);
        builder.Property(df => df.ParentPath).HasMaxLength(500);
        builder.HasOne(df => df.Workspace).WithMany().HasForeignKey(df => df.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(df => df.CreatedByUser).WithMany().HasForeignKey(df => df.CreatedById).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(df => new { df.WorkspaceId, df.Path }).IsUnique();
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(al => al.Id);
        builder.Property(al => al.EntityType).IsRequired().HasMaxLength(50);
        builder.Property(al => al.Description).IsRequired().HasMaxLength(1000);
        builder.Property(al => al.OldValue).HasMaxLength(500);
        builder.Property(al => al.NewValue).HasMaxLength(500);
        builder.Property(al => al.IpAddress).HasMaxLength(45);
        builder.Property(al => al.UserAgent).HasMaxLength(500);
        builder.Property(al => al.Action).HasConversion<string>().HasMaxLength(30);
        builder.HasOne(al => al.User).WithMany().HasForeignKey(al => al.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(al => al.UserId);
        builder.HasIndex(al => al.CreatedAt);
        builder.HasIndex(al => new { al.WorkspaceId, al.CreatedAt });
        builder.HasIndex(al => new { al.EntityType, al.EntityId });
        builder.HasIndex(al => al.Action);
        builder.HasIndex(al => new { al.UserId, al.Action });
        builder.HasIndex(al => new { al.WorkspaceId, al.Action });
    }
}
