using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<HierarchyNode> HierarchyNodes => Set<HierarchyNode>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
