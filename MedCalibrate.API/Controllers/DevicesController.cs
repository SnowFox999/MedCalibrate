using MedCalibrate.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedCalibrate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly MedCalibrateDbContext _context;

    public DevicesController(MedCalibrateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var devices = await _context.Devices.ToListAsync();
        return Ok(devices);
    }
}