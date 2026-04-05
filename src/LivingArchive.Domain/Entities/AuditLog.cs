namespace LivingArchive.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid AdminId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public User Admin { get; set; } = null!;
}
