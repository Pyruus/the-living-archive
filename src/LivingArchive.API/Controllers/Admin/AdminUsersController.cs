using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Policy = PolicyConstants.RequireAdmin)]
public class AdminUsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuditService _auditService;

    public AdminUsersController(IUserService userService, IAuditService auditService)
    {
        _userService = userService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? query,
        [FromQuery] bool? isBlocked,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _userService.GetAllAsync(query, isBlocked, page, pageSize);
        return Ok(new { result.TotalCount, result.Page, result.PageSize, data = result.Data });
    }

    [HttpPut("{id:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid id)
    {
        var result = await _userService.BlockAsync(id);
        if (!result.Success) return NotFound();

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "BlockUser", id.ToString());

        return Ok(result.Data);
    }

    [HttpPut("{id:guid}/unblock")]
    public async Task<IActionResult> UnblockUser(Guid id)
    {
        var result = await _userService.UnblockAsync(id);
        if (!result.Success) return NotFound();

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "UnblockUser", id.ToString());

        return Ok(result.Data);
    }

    private Guid? GetAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
