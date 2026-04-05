using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Admin;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Policy = PolicyConstants.RequireAdmin)]
public class AdminReportsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IAuditService _auditService;

    public AdminReportsController(ICommentService commentService, IAuditService auditService)
    {
        _commentService = commentService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? resolved,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _commentService.GetReportsAsync(resolved, page, pageSize);
        return Ok(new { result.TotalCount, result.Page, result.PageSize, data = result.Data });
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetUnresolvedCount()
    {
        var count = await _commentService.GetUnresolvedReportCountAsync();
        return Ok(new { count });
    }

    [HttpPut("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        var result = await _commentService.ResolveReportAsync(id);
        if (!result.Success) return BadRequest(new { error = result.Error });

        var adminId = GetAdminId();
        if (adminId.HasValue)
            await _auditService.LogAsync(adminId.Value, "ResolveReport", id.ToString());

        return Ok();
    }

    [HttpDelete("comment/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var adminId = GetAdminId();
        if (!adminId.HasValue) return Unauthorized();

        var result = await _commentService.DeleteAsync(commentId, adminId.Value, true);
        if (!result.Success) return BadRequest(new { error = result.Error });

        await _auditService.LogAsync(adminId.Value, "DeleteComment", commentId.ToString());

        return NoContent();
    }

    [HttpPut("comment/{commentId:guid}/restore")]
    public async Task<IActionResult> RestoreComment(Guid commentId)
    {
        var adminId = GetAdminId();
        if (!adminId.HasValue) return Unauthorized();

        var result = await _commentService.RestoreAsync(commentId);
        if (!result.Success) return BadRequest(new { error = result.Error });

        await _auditService.LogAsync(adminId.Value, "RestoreComment", commentId.ToString());

        return Ok();
    }

    private Guid? GetAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
