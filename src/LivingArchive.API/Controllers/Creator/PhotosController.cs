using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Creator;

[ApiController]
[Route("api/creator/[controller]")]
[Authorize(Policy = PolicyConstants.RequireCreatorOrAdmin)]
public class PhotosController : ControllerBase
{
    private readonly IPhotoService _photoService;
    private readonly IWebHostEnvironment _env;

    public PhotosController(IPhotoService photoService, IWebHostEnvironment env)
    {
        _photoService = photoService;
        _env = env;
    }

    [HttpPost]
    [RequestSizeLimit(26_214_400)] // 25 MB
    public async Task<IActionResult> Upload([FromForm] CreatePhotoRequest request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (!await _photoService.LocationExistsAsync(request.HierarchyNodeId))
            return BadRequest(new { error = "Invalid location." });

        string? filePath = null;
        if (request.File is { Length: > 0 })
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp" };
            var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest(new { error = "Unsupported file type. Use: JPG, PNG, TIFF, or WebP." });

            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(uploadsDir, fileName);

            await using var stream = new FileStream(fullPath, FileMode.Create);
            await request.File.CopyToAsync(stream);

            filePath = $"uploads/{fileName}";
        }

        var result = await _photoService.CreateAsync(new CreatePhotoDto(
            userId.Value, request.HierarchyNodeId,
            request.Title, request.Description, request.PhotoDate, filePath));

        if (!result.Success) return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetMyPhoto), new { id = result.Data!.Id },
            new { result.Data.Id, result.Data.Title, result.Data.Status });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyPhotos([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var photos = await _photoService.GetUserPhotosAsync(userId.Value, page, pageSize);
        return Ok(photos);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMyPhoto(Guid id)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var photo = await _photoService.GetUserPhotoAsync(id, userId.Value);
        if (photo is null) return NotFound();

        return Ok(photo);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePhotoRequest request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _photoService.UpdateAsync(id, userId.Value,
            new UpdatePhotoDto(request.Title, request.Description, request.PhotoDate));

        if (!result.Success) return NotFound();

        return Ok(new { result.Data!.Id, result.Data.Title, result.Data.Status });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var photo = await _photoService.GetUserPhotoAsync(id, userId.Value);
        if (photo is null) return NotFound();

        var result = await _photoService.DeleteAsync(id, userId.Value);
        if (!result.Success) return NotFound();

        if (!string.IsNullOrEmpty(photo.FilePath))
        {
            var fullPath = Path.Combine(_env.ContentRootPath, photo.FilePath);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class CreatePhotoRequest
{
    public Guid HierarchyNodeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhotoDate { get; set; }
    public IFormFile? File { get; set; }
}

public class UpdatePhotoRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? PhotoDate { get; set; }
}
