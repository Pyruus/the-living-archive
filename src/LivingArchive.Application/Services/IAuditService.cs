using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;

namespace LivingArchive.Application.Services;

public interface IAuditService
{
    Task LogAsync(Guid adminId, string action, string targetId);
}

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _db;

    public AuditService(IApplicationDbContext db) => _db = db;

    public async Task LogAsync(Guid adminId, string action, string targetId)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            AdminId = adminId,
            Action = action,
            TargetId = targetId,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
