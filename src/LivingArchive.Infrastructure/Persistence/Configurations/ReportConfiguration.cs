using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LivingArchive.Infrastructure.Persistence.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.ToTable("Reports");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedOnAdd();

        builder.Property(r => r.Reason)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(r => r.CreatedAt).IsRequired();

        builder.HasOne(r => r.Photo)
            .WithMany()
            .HasForeignKey(r => r.PhotoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Comment)
            .WithMany()
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Reporter)
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.IsResolved);
    }
}
