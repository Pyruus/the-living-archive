using LivingArchive.Domain.Entities;
using LivingArchive.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LivingArchive.Infrastructure.Persistence.Configurations;

public class HierarchyNodeConfiguration : IEntityTypeConfiguration<HierarchyNode>
{
    public void Configure(EntityTypeBuilder<HierarchyNode> builder)
    {
        builder.ToTable("HierarchyNodes");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).ValueGeneratedOnAdd();

        builder.Property(h => h.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(h => h.Slug)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(h => h.Slug).IsUnique();

        builder.Property(h => h.Latitude);
        builder.Property(h => h.Longitude);

        builder.Property(h => h.Level)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(h => h.Parent)
            .WithMany(h => h.Children)
            .HasForeignKey(h => h.ParentId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasIndex(h => h.ParentId);
    }
}
