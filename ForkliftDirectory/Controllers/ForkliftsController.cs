using ForkliftDirectory.Data;
using ForkliftDirectory.DTOs;
using ForkliftDirectory.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForkliftDirectory.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForkliftsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ForkliftsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetForklifts()
        {
            var now = DateTime.UtcNow;

            var forklifts = await _context.Forklifts
                .OrderBy(f => f.Id)
                .Select(f => new
                {
                    f.Id,
                    f.Brand,
                    f.Number,
                    f.LoadCapacity,
                    f.UpdatedAt,
                    f.UpdatedBy,

                    Active = !f.Downtimes.Any(d =>
                        d.Start <= now &&
                        (d.End == null || d.End > now)
                    )
                })
                .ToListAsync();

            return Ok(forklifts);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateForklift(
            int id,
            UpdateForkliftDto dto)
        {
            var forklift = await _context.Forklifts
                .FindAsync(id);

            if (forklift == null)
            {
                return NotFound();
            }

            forklift.Brand = dto.Brand;
            forklift.Number = dto.Number;
            forklift.LoadCapacity = dto.LoadCapacity;
            forklift.UpdatedAt = DateTime.UtcNow;
            forklift.UpdatedBy = dto.UpdatedBy;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                forklift.Id,
                forklift.Brand,
                forklift.Number,
                forklift.LoadCapacity,
                forklift.UpdatedAt,
                forklift.UpdatedBy
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateForklift(CreateForkliftDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Brand))
            {
                return BadRequest("Марка погрузчика обязательна.");
            }

            if (string.IsNullOrWhiteSpace(dto.Number))
            {
                return BadRequest("Номер погрузчика обязателен.");
            }

            if (dto.LoadCapacity <= 0)
            {
                return BadRequest("Грузоподъёмность должна быть больше нуля.");
            }

            var forklift = new Forklift
            {
                Brand = dto.Brand.Trim(),
                Number = dto.Number.Trim(),
                LoadCapacity = dto.LoadCapacity,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = dto.UpdatedBy
            };

            _context.Forklifts.Add(forklift);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                forklift.Id,
                forklift.Brand,
                forklift.Number,
                forklift.LoadCapacity,
                forklift.UpdatedAt,
                forklift.UpdatedBy
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForklift(int id)
        {
            var forklift = await _context.Forklifts
                .Include(f => f.Downtimes)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (forklift == null)
            {
                return NotFound();
            }

            if (forklift.Downtimes.Any())
            {
                return BadRequest(
                    "Нельзя удалить погрузчик, у которого зарегистрированы простои."
                );
            }

            _context.Forklifts.Remove(forklift);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/downtimes")]
        public async Task<ActionResult<IEnumerable<DowntimeDto>>> GetDowntimes(int id)
        {
            var downtimes = await _context.Downtimes
                .Where(d => d.ForkliftId == id)
                .OrderByDescending(d => d.Start)
                .Select(d => new DowntimeDto
                {
                    Id = d.Id,
                    ForkliftId = d.ForkliftId,
                    Start = d.Start,
                    End = d.End,
                    Reason = d.Reason
                })
                .ToListAsync();

            return Ok(downtimes);
        }

        [HttpPost("{id}/downtimes")]
        public async Task<IActionResult> CreateDowntime(
            int id,
            CreateDowntimeDto dto)
        {
            var forklift = await _context.Forklifts
                .FindAsync(id);

            if (forklift == null)
            {
                return NotFound();
            }

            var downtime = new Downtime
            {
                ForkliftId = id,
                Start = dto.Start,
                End = dto.End,
                Reason = dto.Reason
            };

            _context.Downtimes.Add(downtime);

            if (downtime.End == null)
            {
                forklift.Active = false;
            }

            await _context.SaveChangesAsync();

            var result = new DowntimeDto
            {
                Id = downtime.Id,
                ForkliftId = downtime.ForkliftId,
                Start = downtime.Start,
                End = downtime.End,
                Reason = downtime.Reason
            };

            return Ok(result);
        }

        [HttpPut("{forkliftId}/downtimes/{downtimeId}")]
        public async Task<IActionResult> UpdateDowntime(
            int forkliftId,
            int downtimeId,
            UpdateDowntimeDto dto)
        {
            var forklift = await _context.Forklifts
                .FindAsync(forkliftId);

            if (forklift == null)
            {
                return NotFound("Погрузчик не найден.");
            }

            var downtime = await _context.Downtimes
                .FirstOrDefaultAsync(d =>
                    d.Id == downtimeId &&
                    d.ForkliftId == forkliftId);

            if (downtime == null)
            {
                return NotFound("Простой не найден.");
            }

            if (dto.End.HasValue && dto.End.Value < dto.Start)
            {
                return BadRequest(
                    "Дата окончания не может быть раньше даты начала.");
            }

            downtime.Start = dto.Start;
            downtime.End = dto.End;
            downtime.Reason = dto.Reason;

            var hasActiveDowntime = await _context.Downtimes
                .AnyAsync(d =>
                    d.ForkliftId == forkliftId &&
                    d.Id != downtimeId &&
                    d.End == null);

            if (downtime.End == null)
            {
                forklift.Active = false;
            }
            else
            {
                forklift.Active = !hasActiveDowntime;
            }

            await _context.SaveChangesAsync();

            var result = new DowntimeDto
            {
                Id = downtime.Id,
                ForkliftId = downtime.ForkliftId,
                Start = downtime.Start,
                End = downtime.End,
                Reason = downtime.Reason
            };

            return Ok(result);
        }

        [HttpDelete("downtimes/{downtimeId}")]
        public async Task<IActionResult> DeleteDowntime(int downtimeId)
        {
            var downtime = await _context.Downtimes
                .FindAsync(downtimeId);

            if (downtime == null)
            {
                return NotFound();
            }

            _context.Downtimes.Remove(downtime);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}