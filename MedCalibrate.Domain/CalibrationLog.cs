using System;
using System.ComponentModel;
namespace MedCalibrate.Domain;

public class CalibrationLog
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; } // Foreign key
    public DateTime CalibrationDate { get; set; }
    public ResponsibleTechnician Technician { get; set; } = ResponsibleTechnician.JuergenSchulz;
    public decimal MeasuredError { get; set; } // Measured error (e.g., in %)
    public bool IsPassed { get; set; } // Whether the calibration was passed
    public string Notes { get; set; } = string.Empty;

    // Link back to Device (navigation property)
    public Device? Device { get; set; }
}


public enum ResponsibleTechnician
{
    [Description("Dr. Jürgen Schulz")]
    JuergenSchulz = 1,

    [Description("Martina Weber")]
    MartinaWeber = 2,

    [Description("Stefan Baumgartner")]
    StefanBaumgartner = 3,

    [Description("Elena Petrova")]
    ElenaPetrova = 4
}