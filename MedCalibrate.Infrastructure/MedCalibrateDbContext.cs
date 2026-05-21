using Microsoft.EntityFrameworkCore;
using MedCalibrate.Domain;

namespace MedCalibrate.Infrastructure;

public class MedCalibrateDbContext : DbContext
{
    public MedCalibrateDbContext(DbContextOptions<MedCalibrateDbContext> options) 
        : base(options) { }

    public DbSet<Device> Devices => Set<Device>();
    public DbSet<CalibrationLog> CalibrationLogs => Set<CalibrationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        //  One-to-Many
        modelBuilder.Entity<CalibrationLog>()
            .HasOne(c => c.Device)
            .WithMany(d => d.CalibrationLogs)
            .HasForeignKey(c => c.DeviceId);
            
        base.OnModelCreating(modelBuilder);
    }
}
