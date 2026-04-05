using LivingArchive.Domain.Enums;

namespace LivingArchive.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Viewer;
    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
