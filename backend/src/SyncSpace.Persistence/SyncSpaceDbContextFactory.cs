using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SyncSpace.Persistence.Context;

namespace SyncSpace.Persistence;

public class SyncSpaceDbContextFactory : IDesignTimeDbContextFactory<SyncSpaceDbContext>
{
    public SyncSpaceDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SyncSpaceDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=syncspace;Username=postgres;Password=postgres");
        return new SyncSpaceDbContext(optionsBuilder.Options);
    }
}
