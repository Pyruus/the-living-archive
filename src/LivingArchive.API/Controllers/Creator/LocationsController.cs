using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Creator;

[ApiController]
[Route("api/creator/[controller]")]
[Authorize(Policy = PolicyConstants.RequireCreatorOrAdmin)]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest request)
    {
        var result = await _locationService.CreateAsync(new CreateLocationDto(
            request.ParentId, request.Name, request.Level,
            request.Latitude, request.Longitude));

        if (!result.Success)
            return BadRequest(new { error = result.Error });

        return Ok(result.Data);
    }
}

public class CreateLocationRequest
{
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
