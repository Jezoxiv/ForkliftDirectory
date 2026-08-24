namespace ForkliftDirectory.Models;

public class Downtime
{
    public int Id { get; set; }

    public int ForkliftId { get; set; }

    public DateTime Start { get; set; }

    public DateTime? End { get; set; }

    public string Reason { get; set; } = string.Empty;

    public Forklift Forklift { get; set; } = null!;
}