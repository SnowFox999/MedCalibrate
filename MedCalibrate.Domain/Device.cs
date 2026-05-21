using System;
using System.Collections.Generic;

namespace MedCalibrate.Domain;

public class Device
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty; // Hospital
    public DateTime NextCalibrationDate { get; set; }
    
    // One-to-Many: one device might have many calibration logs
    public List<CalibrationLog> CalibrationLogs { get; set; } = new();
}
