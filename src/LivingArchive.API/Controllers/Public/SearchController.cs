using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Public;

[ApiController]
[Route("api/public/[controller]")]
[AllowAnonymous]
public class SearchController : ControllerBase
{
    private readonly IPhotoService _photoService;
    private readonly ILocationService _locationService;

    public SearchController(IPhotoService photoService, ILocationService locationService)
    {
        _photoService = photoService;
        _locationService = locationService;
    }

    [HttpGet("photos")]
    public async Task<IActionResult> SearchPhotos(
        [FromQuery] string? query,
        [FromQuery] string? period,
        [FromQuery] Guid? locationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _photoService.SearchAsync(new SearchPhotosQuery(
            query, period, locationId, page, pageSize));

        return Ok(new { result.TotalCount, result.Page, result.PageSize, data = result.Data });
    }

    [HttpGet("photos/{id:guid}")]
    public async Task<IActionResult> GetPhoto(Guid id)
    {
        var result = await _photoService.GetPublicPhotoAsync(id);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("locations")]
    public async Task<IActionResult> GetLocationTree()
    {
        var nodes = await _locationService.GetPublicTreeAsync();
        return Ok(nodes);
    }
}
