using LivingArchive.Domain.Enums;

namespace LivingArchive.Domain.Entities;

public class HierarchyNode
{
    public Guid Id { get; set; }
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public HierarchyLevel Level { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public HierarchyNode? Parent { get; set; }
    public ICollection<HierarchyNode> Children { get; set; } = new List<HierarchyNode>();
    public ICollection<Photo> Photos { get; set; } = new List<Photo>();
}
