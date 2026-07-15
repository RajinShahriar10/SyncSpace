using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Common;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Models;

namespace SyncSpace.Persistence.Context;

public class SyncSpaceDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public SyncSpaceDbContext(DbContextOptions<SyncSpaceDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<BoardCard> BoardCards => Set<BoardCard>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<CardLabel> CardLabels => Set<CardLabel>();
    public DbSet<Channel> Channels => Set<Channel>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Reaction> Reactions => Set<Reaction>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<DocumentComment> DocumentComments => Set<DocumentComment>();
    public DbSet<DocumentCommentReaction> DocumentCommentReactions => Set<DocumentCommentReaction>();
    public DbSet<BoardCardComment> BoardCardComments => Set<BoardCardComment>();
    public DbSet<BoardCardAttachment> BoardCardAttachments => Set<BoardCardAttachment>();
    public DbSet<BoardActivity> BoardActivities => Set<BoardActivity>();
    public DbSet<ChannelMember> ChannelMembers => Set<ChannelMember>();
    public DbSet<MessageReadReceipt> MessageReadReceipts => Set<MessageReadReceipt>();
    public DbSet<MessageEdit> MessageEdits => Set<MessageEdit>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<DirectMessage> DirectMessages => Set<DirectMessage>();
    public DbSet<DirectMessageReaction> DirectMessageReactions => Set<DirectMessageReaction>();
    public DbSet<DirectMessageReadReceipt> DirectMessageReadReceipts => Set<DirectMessageReadReceipt>();
    public DbSet<DriveFile> DriveFiles => Set<DriveFile>();
    public DbSet<DriveFolder> DriveFolders => Set<DriveFolder>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<ProjectGroup> ProjectGroups => Set<ProjectGroup>();
    public DbSet<ProjectGroupMember> ProjectGroupMembers => Set<ProjectGroupMember>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<InstructorProfile> InstructorProfiles => Set<InstructorProfile>();
    public DbSet<ContributionRecord> ContributionRecords => Set<ContributionRecord>();
    public DbSet<MilestoneAssignment> MilestoneAssignments => Set<MilestoneAssignment>();
    public DbSet<MilestoneReminder> MilestoneReminders => Set<MilestoneReminder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SyncSpaceDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.CreatedAt))
                    .HasDefaultValueSql("now()");
                modelBuilder.Entity(entityType.ClrType).Property(nameof(BaseEntity.UpdatedAt))
                    .HasDefaultValueSql("now()");
            }
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
