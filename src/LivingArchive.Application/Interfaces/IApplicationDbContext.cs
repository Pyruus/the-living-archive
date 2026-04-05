using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Photo> Photos { get; }
    DbSet<HierarchyNode> HierarchyNodes { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Report> Reports { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
