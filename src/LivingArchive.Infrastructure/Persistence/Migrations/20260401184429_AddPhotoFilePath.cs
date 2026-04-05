using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LivingArchive.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoFilePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Photos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Photos");
        }
    }
}
