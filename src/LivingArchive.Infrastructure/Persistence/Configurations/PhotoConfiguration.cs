using LivingArchive.Domain.Entities;
using LivingArchive.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LivingArchive.Infrastructure.Persistence.Configurations;

public class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.ToTable("Photos");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedOnAdd();

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.PhotoDate)
            .HasMaxLength(100);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasOne(p => p.Uploader)
            .WithMany(u => u.Photos)
            .HasForeignKey(p => p.UploaderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.HierarchyNode)
            .WithMany(h => h.Photos)
            .HasForeignKey(p => p.HierarchyNodeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.PhotoDate);
    }
}
