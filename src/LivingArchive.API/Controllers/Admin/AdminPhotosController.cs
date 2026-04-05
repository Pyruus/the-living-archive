using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Policy = PolicyConstants.RequireAdmin)]
public class AdminPhotosController : ControllerBase
{
    private readonly IPhotoService _photoService;
    private readonly IAuditService _auditService;
    private readonly IWebHostEnvironment _env;

    public AdminPhotosController(
        IPhotoService photoService,
        IAuditService auditService,
        IWebHostEnvironment env)
    {
        _photoService = photoService;
        _auditService = auditService;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _photoService.AdminGetAllAsync(status, query, page, pageSize);
        return Ok(new { result.TotalCount, result.Page, result.PageSize, data = result.Data });
    }

    [HttpPut("{id:guid}/metadata")]
    public async Task<IActionResult> EditMetadata(Guid id, [FromBody] AdminEditMetadataRequest request)
    {
        var result = await _photoService.AdminEditMetadataAsync(id,
            new AdminEditPhotoDto(request.Title, request.Description, request.PhotoDate, request.HierarchyNodeId));

        if (!result.Success) return BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "EditMetadata", id.ToString());

        return Ok(new { Id = id });
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] AdminSetStatusRequest request)
    {
        var result = await _photoService.AdminSetStatusAsync(id, request.Status);
        if (!result.Success) return BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, $"SetStatus:{result.Data}", id.ToString());

        return Ok(new { Id = id, Status = result.Data });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _photoService.AdminDeleteAsync(id);
        if (!result.Success) return NotFound();

        if (!string.IsNullOrEmpty(result.Data))
        {
            var fullPath = Path.Combine(_env.ContentRootPath, result.Data);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "DeletePhoto", id.ToString());

        return NoContent();
    }

    [HttpPut("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id)
    {
        var result = await _photoService.AdminRestoreAsync(id);
        if (!result.Success) return BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "RestorePhoto", id.ToString());

        return Ok();
    }

    private Guid? GetAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class AdminEditMetadataRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? PhotoDate { get; set; }
    public Guid? HierarchyNodeId { get; set; }
}

public class AdminSetStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
