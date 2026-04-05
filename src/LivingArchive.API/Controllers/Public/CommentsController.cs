using System.Security.Claims;
using LivingArchive.API.Auth;
using LivingArchive.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LivingArchive.API.Controllers.Public;

[ApiController]
[Route("api/public/comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IAuditService _auditService;

    public CommentsController(ICommentService commentService, IAuditService auditService)
    {
        _commentService = commentService;
        _auditService = auditService;
    }

    [HttpGet("{photoId:guid}")]
    public async Task<IActionResult> GetByPhoto(Guid photoId)
    {
        var currentUserId = GetUserId();
        var comments = await _commentService.GetByPhotoAsync(photoId, currentUserId);
        return Ok(comments);
    }

    [HttpPost]
    [Authorize(Policy = PolicyConstants.RequireCreatorOrAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateCommentRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _commentService.CreateAsync(
            new CreateCommentDto(request.PhotoId, userId.Value, request.Content));

        if (!result.Success) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var isAdmin = User.IsInRole("Admin");
        var result = await _commentService.DeleteAsync(id, userId.Value, isAdmin);

        if (!result.Success) return BadRequest(new { error = result.Error });

        if (isAdmin)
            await _auditService.LogAsync(userId.Value, "DeleteComment", id.ToString());

        return NoContent();
    }

    [HttpPost("report")]
    [Authorize]
    public async Task<IActionResult> ReportComment([FromBody] ReportRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _commentService.ReportCommentAsync(
            new CreateReportDto(userId.Value, null, request.TargetId, request.Reason));

        if (!result.Success) return BadRequest(new { error = result.Error });
        return Ok();
    }

    [HttpPost("report-photo")]
    [Authorize]
    public async Task<IActionResult> ReportPhoto([FromBody] ReportRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _commentService.ReportPhotoAsync(
            new CreateReportDto(userId.Value, request.TargetId, null, request.Reason));

        if (!result.Success) return BadRequest(new { error = result.Error });
        return Ok();
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class CreateCommentRequest
{
    public Guid PhotoId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class ReportRequest
{
    public Guid TargetId { get; set; }
    public string Reason { get; set; } = string.Empty;
}
