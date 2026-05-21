using System;

namespace MedCalibrate.Domain;

public class CalibrationLog
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; } // Foreign key
    public DateTime CalibrationDate { get; set; }
    public string TechnicalName { get; set; } = string.Empty;
    public decimal MeasuredError { get; set; } // Measured error (e.g., in %)
    public bool IsPassed { get; set; } // Whether the calibration was passed
    public string Notes { get; set; } = string.Empty;

    // Link back to Device (navigation property)
    public Device? Device { get; set; }
}
