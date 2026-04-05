using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Policy = PolicyConstants.RequireAdmin)]
public class AdminLocationsController : ControllerBase
{
    private readonly ILocationService _locationService;
    private readonly IAuditService _auditService;

    public AdminLocationsController(ILocationService locationService, IAuditService auditService)
    {
        _locationService = locationService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var nodes = await _locationService.GetAllAsync();
        return Ok(nodes);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCreateLocationRequest request)
    {
        var result = await _locationService.CreateAsync(new CreateLocationDto(
            request.ParentId, request.Name, request.Level,
            request.Latitude, request.Longitude));

        if (!result.Success)
            return BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "CreateLocation", result.Data!.Id.ToString());

        return Ok(result.Data);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AdminUpdateLocationRequest request)
    {
        var result = await _locationService.UpdateAsync(id,
            new UpdateLocationDto(request.Name, request.Latitude, request.Longitude));

        if (!result.Success)
            return result.Error == "Location not found."
                ? NotFound()
                : BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "EditLocation", id.ToString());

        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _locationService.DeleteAsync(id);

        if (!result.Success)
            return result.Error == "Location not found."
                ? NotFound()
                : BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "DeleteLocation", id.ToString());

        return NoContent();
    }

    private Guid? GetAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class AdminCreateLocationRequest
{
    public Guid? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class AdminUpdateLocationRequest
{
    public string? Name { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
