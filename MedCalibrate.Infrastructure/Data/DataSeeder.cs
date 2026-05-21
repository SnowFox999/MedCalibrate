using System.Text.Json;
using Bogus;
using MedCalibrate.Domain;

namespace MedCalibrate.Infrastructure.Data;

public class DeviceTemplate 
{
    public string Name { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
}

public static class DataSeeder
{
    public static void Seed(MedCalibrateDbContext context)
    {
        // if data already exists, do not seed
        if (context.Devices.Any()) return;

        var jsonPath = Path.Combine(AppContext.BaseDirectory, "Resources", "devices.json");
        
        if (!File.Exists(jsonPath))
        {
            throw new FileNotFoundException($"File not found: {jsonPath}");
        }

        var jsonContent = File.ReadAllText(jsonPath);
        var templates = JsonSerializer.Deserialize<List<DeviceTemplate>>(jsonContent) ?? new();

    
        var deviceFaker = new Faker<Device>()
            .RuleFor(d => d.Id, f => Guid.NewGuid())
            .RuleFor(d => d.Name, (f, d) => f.PickRandom(templates).Name)
            .RuleFor(d => d.Manufacturer, (f, d) => f.PickRandom(templates).Manufacturer)
            .RuleFor(d => d.SerialNumber, f => f.Random.AlphaNumeric(10).ToUpper())
            .RuleFor(d => d.Department, f => f.PickRandom(new[] { "Cardiology", "Radiology", "Emergency", "Laboratory", "Surgery", "ICU" }))
            .RuleFor(d => d.NextCalibrationDate, f => f.Date.Future(1));

        var devices = deviceFaker.Generate(150);
        context.Devices.AddRange(devices);

        var logFaker = new Faker<CalibrationLog>()
            .RuleFor(l => l.Id, f => Guid.NewGuid())
            .RuleFor(l => l.CalibrationDate, f => f.Date.Past(2).ToUniversalTime())
            .RuleFor(l => l.TechnicalName, f => f.Name.FullName())
            .RuleFor(l => l.MeasuredError, f => f.Random.Decimal(0.01m, 0.5m))
            .RuleFor(l => l.IsPassed, f => f.Random.Bool(0.9f));

        foreach (var device in devices)
        {
            var logs = logFaker.Generate(50);
            foreach (var log in logs)
            {
                log.DeviceId = device.Id;
            }
            context.CalibrationLogs.AddRange(logs);
        }

        context.SaveChanges();
    }
}