using Microsoft.EntityFrameworkCore;
using ForkliftDirectory.Models;

namespace ForkliftDirectory.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Forklift> Forklifts { get; set; }

    public DbSet<Downtime> Downtimes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Downtime>()
            .HasOne(d => d.Forklift)
            .WithMany(f => f.Downtimes)
            .HasForeignKey(d => d.ForkliftId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}