using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedCalibrate.Infrastructure; 
using MedCalibrate.Domain;
using System.ComponentModel;
using System;
using System.Threading.Tasks;

namespace MedCalibrate.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalibrationsController : ControllerBase
    {
        private readonly MedCalibrateDbContext _context;

        public CalibrationsController(MedCalibrateDbContext context)
        {
            _context = context;
        }

        [HttpGet("technicians")]
        public ActionResult<List<string>> GetTechnicians()
        {
            var technicians = Enum.GetValues(typeof(ResponsibleTechnician))
                .Cast<ResponsibleTechnician>()
                .Select(t =>
                {
                    // Ищем атрибут [Description] у каждого элемента enum
                    var fieldInfo = t.GetType().GetField(t.ToString());
                    var attributes = fieldInfo?.GetCustomAttributes(typeof(DescriptionAttribute), false) 
                                    as DescriptionAttribute[];

                    // Если нашли — берем красивый текст, если нет — оставляем системное имя
                    return attributes != null && attributes.Length > 0 
                        ? attributes[0].Description 
                        : t.ToString();
                })
                .ToList();

            return Ok(technicians);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCalibration([FromBody] CalibrationLog log)
        {
            if (log == null || log.DeviceId == Guid.Empty)
            {
                return BadRequest("Некорректные данные калибровки.");
            }

            // 1. Проверяем, существует ли прибор в БД
            var device = await _context.Devices.FindAsync(log.DeviceId);
            if (device == null)
            {
                return NotFound("Указанный медицинский прибор не найден.");
            }

            // 2. Генерируем ID для лога и добавляем в контекст
            log.Id = Guid.NewGuid();
            _context.CalibrationLogs.Add(log); // Убедись, что DbSet в AppDbContext называется CalibrationLogs

            // 3. Бизнес-логика: если прибор прошел калибровку, обновляем дату у прибора
            if (log.IsPassed)
            {
                device.NextCalibrationDate = log.CalibrationDate.AddYears(1);
                _context.Entry(device).State = EntityState.Modified;
            }

            // 4. Сохраняем всё в PostgreSQL
            await _context.SaveChangesAsync();

            return Ok(log);
        }
    }
}