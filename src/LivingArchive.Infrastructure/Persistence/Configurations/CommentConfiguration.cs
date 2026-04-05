using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LivingArchive.Infrastructure.Persistence.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedOnAdd();

        builder.Property(c => c.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(c => c.CreatedAt).IsRequired();

        builder.HasOne(c => c.Photo)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PhotoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Author)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.PhotoId);
        builder.HasIndex(c => c.IsReported);
    }
}
