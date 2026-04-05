using LivingArchive.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Services;

public record AuditLogDto(
    Guid Id, string Action, string TargetId,
    DateTime Timestamp, AdminUploaderDto Admin);

public interface IAuditLogQueryService
{
    Task<PaginatedDto<AuditLogDto>> GetAllAsync(string? action, Guid? adminId, int page, int pageSize);
}

public class AuditLogQueryService : IAuditLogQueryService
{
    private readonly IApplicationDbContext _db;

    public AuditLogQueryService(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedDto<AuditLogDto>> GetAllAsync(string? action, Guid? adminId, int page, int pageSize)
    {
        var q = _db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(action))
            q = q.Where(l => l.Action.Contains(action));

        if (adminId.HasValue)
            q = q.Where(l => l.AdminId == adminId.Value);

        var totalCount = await q.CountAsync();

        var logs = await q
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogDto(
                l.Id, l.Action, l.TargetId, l.Timestamp,
                new AdminUploaderDto(l.Admin.Id, l.Admin.DisplayName, l.Admin.Email)))
            .ToListAsync();

        return new PaginatedDto<AuditLogDto>(totalCount, page, pageSize, logs);
    }
}
