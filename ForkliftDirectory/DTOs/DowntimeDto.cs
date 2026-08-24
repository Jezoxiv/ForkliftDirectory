namespace ForkliftDirectory.DTOs;

public class DowntimeDto
{
    public int Id { get; set; }

    public int ForkliftId { get; set; }

    public DateTime Start { get; set; }

    public DateTime? End { get; set; }

    public string Reason { get; set; } = string.Empty;
}