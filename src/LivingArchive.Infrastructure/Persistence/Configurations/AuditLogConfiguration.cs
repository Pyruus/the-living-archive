using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LivingArchive.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.TargetId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.Timestamp)
            .IsRequired();

        builder.HasOne(a => a.Admin)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.AdminId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.AdminId);
    }
}
