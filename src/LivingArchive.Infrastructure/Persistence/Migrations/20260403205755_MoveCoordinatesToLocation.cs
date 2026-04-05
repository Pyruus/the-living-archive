using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LivingArchive.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveCoordinatesToLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Photos");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "HierarchyNodes",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "HierarchyNodes",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "HierarchyNodes");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "HierarchyNodes");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Photos",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Photos",
                type: "double precision",
                nullable: true);
        }
    }
}
