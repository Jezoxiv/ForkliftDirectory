namespace ForkliftDirectory.DTOs;

public class UpdateDowntimeDto
{
    public DateTime Start { get; set; }

    public DateTime? End { get; set; }

    public string Reason { get; set; } = string.Empty;
}