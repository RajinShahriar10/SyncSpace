using Microsoft.EntityFrameworkCore;
using SyncSpace.Domain.Common;
using SyncSpace.Domain.Entities;
using SyncSpace.Persistence.Context;

namespace SyncSpace.Infrastructure.IntegrationTests;

public class TestSyncSpaceDbContext : SyncSpaceDbContext
{
    public TestSyncSpaceDbContext(DbContextOptions<SyncSpaceDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Conversation>(builder =>
        {
            builder.HasOne(c => c.User1).WithMany().HasForeignKey(c => c.User1Id).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(c => c.User2).WithMany().HasForeignKey(c => c.User2Id).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Message>(builder =>
        {
            builder.HasOne(m => m.Sender).WithMany(u => u.Messages).HasForeignKey(m => m.SenderId);
            builder.HasOne(m => m.PinnedBy).WithMany().HasForeignKey(m => m.PinnedById).OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(m => m.Thread).WithMany(m => m.Replies).HasForeignKey(m => m.ThreadId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentComment>(builder =>
        {
            builder.HasOne(dc => dc.ParentComment).WithMany(dc => dc.Replies).HasForeignKey(dc => dc.ParentCommentId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
