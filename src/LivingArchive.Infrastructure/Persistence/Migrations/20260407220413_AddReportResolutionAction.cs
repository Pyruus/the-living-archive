using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LivingArchive.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReportResolutionAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResolutionAction",
                table: "Reports",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResolutionAction",
                table: "Reports");
        }
    }
}
