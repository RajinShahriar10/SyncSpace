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

        builder.HasOne(w => w.Owner)
            .WithMany()
            .HasForeignKey(w => w.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WorkspaceMemberConfiguration : IEntityTypeConfiguration<WorkspaceMember>
{
    public void Configure(EntityTypeBuilder<WorkspaceMember> builder)
    {
        builder.HasKey(wm => wm.Id);

        builder.HasOne(wm => wm.User)
            .WithMany(u => u.WorkspaceMembers)
            .HasForeignKey(wm => wm.UserId);

        builder.HasOne(wm => wm.Workspace)
            .WithMany(w => w.Members)
            .HasForeignKey(wm => wm.WorkspaceId);

        builder.HasIndex(wm => new { wm.UserId, wm.WorkspaceId }).IsUnique();
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

        builder.HasOne(d => d.Workspace)
            .WithMany(w => w.Documents)
            .HasForeignKey(d => d.WorkspaceId);

        builder.HasOne(d => d.Author)
            .WithMany(u => u.Documents)
            .HasForeignKey(d => d.AuthorId);
    }
}

public class BoardConfiguration : IEntityTypeConfiguration<Board>
{
    public void Configure(EntityTypeBuilder<Board> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Description).HasMaxLength(1000);

        builder.HasOne(b => b.Workspace)
            .WithMany(w => w.Boards)
            .HasForeignKey(b => b.WorkspaceId);

        builder.HasOne(b => b.Author)
            .WithMany()
            .HasForeignKey(b => b.AuthorId);
    }
}

public class BoardColumnConfiguration : IEntityTypeConfiguration<BoardColumn>
{
    public void Configure(EntityTypeBuilder<BoardColumn> builder)
    {
        builder.HasKey(bc => bc.Id);
        builder.Property(bc => bc.Name).IsRequired().HasMaxLength(100);
        builder.Property(bc => bc.Color).HasMaxLength(7);

        builder.HasOne(bc => bc.Board)
            .WithMany(b => b.Columns)
            .HasForeignKey(bc => bc.BoardId);
    }
}

public class BoardCardConfiguration : IEntityTypeConfiguration<BoardCard>
{
    public void Configure(EntityTypeBuilder<BoardCard> builder)
    {
        builder.HasKey(bc => bc.Id);
        builder.Property(bc => bc.Title).IsRequired().HasMaxLength(500);
        builder.Property(bc => bc.Description).HasColumnType("text");

        builder.HasOne(bc => bc.Column)
            .WithMany(c => c.Cards)
            .HasForeignKey(bc => bc.ColumnId);

        builder.HasOne(bc => bc.Assignee)
            .WithMany()
            .HasForeignKey(bc => bc.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ChannelConfiguration : IEntityTypeConfiguration<Channel>
{
    public void Configure(EntityTypeBuilder<Channel> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);

        builder.HasOne(c => c.Workspace)
            .WithMany(w => w.Channels)
            .HasForeignKey(c => c.WorkspaceId);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Content).IsRequired().HasColumnType("text");

        builder.HasOne(m => m.Channel)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChannelId);

        builder.HasOne(m => m.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey(m => m.SenderId);

        builder.HasOne(m => m.Thread)
            .WithMany(m => m.Replies)
            .HasForeignKey(m => m.ThreadId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Emoji).IsRequired().HasMaxLength(10);

        builder.HasOne(r => r.Message)
            .WithMany(m => m.Reactions)
            .HasForeignKey(r => r.MessageId);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId);
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

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId);
    }
}
