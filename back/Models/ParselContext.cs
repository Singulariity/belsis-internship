using Microsoft.EntityFrameworkCore;

namespace backend.Models; 

public class ParselContext : DbContext {

	public ParselContext(DbContextOptions<ParselContext> options) : base(options) {
		
	}

	public DbSet<Parsel>? Parsels { get; set; }
	
}