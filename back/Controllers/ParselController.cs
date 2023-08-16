using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers; 

[Route("api/[controller]")]
[ApiController]
public class ParselController : ControllerBase {

	private readonly ParselContext _dbContext;

	public ParselController(ParselContext dbContext) {
		_dbContext = dbContext;
	}

	[HttpGet("getall")]
	public async Task<ActionResult<IEnumerable<Parsel>>> GetParsels() {
		if (_dbContext.Parsels == null) {
			return NotFound();
		}

		return await _dbContext.Parsels.ToListAsync();
	}
    
	[HttpGet("{id:int}/get")]
	public async Task<ActionResult<Parsel>> GetParsel(int id) {
		if (_dbContext.Parsels == null) {
			return NotFound();
		}

		var parsel = await _dbContext.Parsels.FindAsync(id);
		if (parsel == null) {
			return NotFound();
		}

		return parsel;
	}

	[HttpPost("add")]
	public async Task<ActionResult<Parsel>> PostParsel(Parsel parsel) {
		if (_dbContext.Parsels == null) {
			return NotFound();
		}
		
		await _dbContext.Parsels.AddAsync(parsel);
		await _dbContext.SaveChangesAsync();
        
		return CreatedAtAction(nameof(GetParsel), new { id = parsel.ID }, parsel);
	}

	[HttpPost("{id:int}/remove")]
	public async Task<ActionResult> RemoveParsel(int id) {
		if (_dbContext.Parsels == null) {
			return NotFound();
		}

		var parsel = await _dbContext.Parsels.FindAsync(id);
		if (parsel == null) {
			return NotFound();
		}

		_dbContext.Parsels.Remove(parsel);
		await _dbContext.SaveChangesAsync();

		return Ok();
	}

	[HttpPut("{id:int}/update")]
	public async Task<IActionResult> UpdateParsel(int id, Parsel parselData) {
		if (_dbContext.Parsels == null) {
			return NotFound();
		}
		
		var parsel = await _dbContext.Parsels.FindAsync(id);
		if (parsel == null) {
			return NotFound();
		}

		parsel.City = parselData.City;
		parsel.District = parselData.District;
		parsel.Street = parselData.Street;
		parsel.WKT = parselData.WKT;

		await _dbContext.SaveChangesAsync();

		return Ok();
	}

}