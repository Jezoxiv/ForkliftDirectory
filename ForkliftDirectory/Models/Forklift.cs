namespace ForkliftDirectory.Models;

public class Forklift
{
    public int Id { get; set; }

    public string Brand { get; set; } = string.Empty;

    public string Number { get; set; } = string.Empty;
    
    /*[Column(TypeName = "numeric(10,3)")]*/
    public decimal LoadCapacity { get; set; }

    public bool Active { get; set; } = true;

    public DateTime UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public ICollection<Downtime> Downtimes { get; set; }
    = new List<Downtime>();
}
