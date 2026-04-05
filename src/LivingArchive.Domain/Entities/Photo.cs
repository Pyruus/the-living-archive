using LivingArchive.Domain.Enums;

namespace LivingArchive.Domain.Entities;

public class Photo
{
    public Guid Id { get; set; }
    public Guid UploaderId { get; set; }
    public Guid HierarchyNodeId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? PhotoDate { get; set; }
    public string? FilePath { get; set; }

    public PhotoStatus Status { get; set; } = PhotoStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public bool IsReported { get; set; }

    public User Uploader { get; set; } = null!;
    public HierarchyNode HierarchyNode { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
