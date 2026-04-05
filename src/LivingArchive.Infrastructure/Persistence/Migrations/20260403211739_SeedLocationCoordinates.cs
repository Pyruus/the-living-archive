using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LivingArchive.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedLocationCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Country ──
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 51.9194, "Longitude" = 19.1451
                WHERE "Id" = 'a0000000-0000-0000-0000-000000000001' AND "Latitude" IS NULL;
            """);

            // ── Cities ──
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.2297, "Longitude" = 21.0122
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000001' AND "Latitude" IS NULL;
            """); // Warszawa

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 50.0647, "Longitude" = 19.9450
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000002' AND "Latitude" IS NULL;
            """); // Kraków

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 54.3520, "Longitude" = 18.6466
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000003' AND "Latitude" IS NULL;
            """); // Gdańsk

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 51.1079, "Longitude" = 17.0385
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000004' AND "Latitude" IS NULL;
            """); // Wrocław

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.4064, "Longitude" = 16.9252
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000005' AND "Latitude" IS NULL;
            """); // Poznań

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 51.7592, "Longitude" = 19.4560
                WHERE "Id" = 'b0000000-0000-0000-0000-000000000006' AND "Latitude" IS NULL;
            """); // Łódź

            // ── Districts: Warszawa ──
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.2550, "Longitude" = 21.0122
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000001' AND "Latitude" IS NULL;
            """); // Stare Miasto

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.2560, "Longitude" = 21.0440
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000002' AND "Latitude" IS NULL;
            """); // Praga Północ

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.1935, "Longitude" = 21.0034
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000003' AND "Latitude" IS NULL;
            """); // Mokotów

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 52.2380, "Longitude" = 20.9700
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000004' AND "Latitude" IS NULL;
            """); // Wola

            // ── Districts: Kraków ──
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 50.0614, "Longitude" = 19.9373
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000005' AND "Latitude" IS NULL;
            """); // Stare Miasto

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 50.0480, "Longitude" = 19.9460
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000006' AND "Latitude" IS NULL;
            """); // Kazimierz

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 50.0720, "Longitude" = 20.0380
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000007' AND "Latitude" IS NULL;
            """); // Nowa Huta

            // ── Districts: Gdańsk ──
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 54.3486, "Longitude" = 18.6534
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000008' AND "Latitude" IS NULL;
            """); // Główne Miasto

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 54.3700, "Longitude" = 18.6128
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000009' AND "Latitude" IS NULL;
            """); // Wrzeszcz

            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = 54.4120, "Longitude" = 18.5590
                WHERE "Id" = 'c0000000-0000-0000-0000-000000000010' AND "Latitude" IS NULL;
            """); // Oliwa
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert coordinates to NULL for all seeded locations
            migrationBuilder.Sql("""
                UPDATE "HierarchyNodes" SET "Latitude" = NULL, "Longitude" = NULL
                WHERE "Id" IN (
                    'a0000000-0000-0000-0000-000000000001',
                    'b0000000-0000-0000-0000-000000000001',
                    'b0000000-0000-0000-0000-000000000002',
                    'b0000000-0000-0000-0000-000000000003',
                    'b0000000-0000-0000-0000-000000000004',
                    'b0000000-0000-0000-0000-000000000005',
                    'b0000000-0000-0000-0000-000000000006',
                    'c0000000-0000-0000-0000-000000000001',
                    'c0000000-0000-0000-0000-000000000002',
                    'c0000000-0000-0000-0000-000000000003',
                    'c0000000-0000-0000-0000-000000000004',
                    'c0000000-0000-0000-0000-000000000005',
                    'c0000000-0000-0000-0000-000000000006',
                    'c0000000-0000-0000-0000-000000000007',
                    'c0000000-0000-0000-0000-000000000008',
                    'c0000000-0000-0000-0000-000000000009',
                    'c0000000-0000-0000-0000-000000000010'
                );
            """);
        }
    }
}
