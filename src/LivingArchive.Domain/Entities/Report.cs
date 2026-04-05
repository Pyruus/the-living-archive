namespace LivingArchive.Domain.Entities;

public class Report
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public Guid? PhotoId { get; set; }
    public Guid? CommentId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsResolved { get; set; }
    public string? ResolutionAction { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Reporter { get; set; } = null!;
    public Photo? Photo { get; set; }
    public Comment? Comment { get; set; }
}
