namespace LivingArchive.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public Guid PhotoId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsReported { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Photo Photo { get; set; } = null!;
    public User Author { get; set; } = null!;
}
