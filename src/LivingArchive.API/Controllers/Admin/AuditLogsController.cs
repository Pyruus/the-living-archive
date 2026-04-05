using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Policy = PolicyConstants.RequireAdmin)]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogQueryService _auditLogQueryService;

    public AuditLogsController(IAuditLogQueryService auditLogQueryService)
    {
        _auditLogQueryService = auditLogQueryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? action,
        [FromQuery] Guid? adminId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _auditLogQueryService.GetAllAsync(action, adminId, page, pageSize);
        return Ok(new { result.TotalCount, result.Page, result.PageSize, data = result.Data });
    }
}
