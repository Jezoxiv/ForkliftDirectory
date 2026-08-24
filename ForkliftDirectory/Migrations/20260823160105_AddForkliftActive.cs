using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ForkliftDirectory.Migrations
{
    /// <inheritdoc />
    public partial class AddForkliftActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "Forklifts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Active",
                table: "Forklifts");
        }
    }
}
