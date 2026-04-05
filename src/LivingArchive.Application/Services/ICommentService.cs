using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Services;


public record CommentDto(
    Guid Id, string Content, DateTime CreatedAt,
    bool IsReported, CommentAuthorDto Author);

public record CommentAuthorDto(Guid Id, string DisplayName);

public record CreateCommentDto(Guid PhotoId, Guid AuthorId, string Content);

public record ReportDto(
    Guid Id, string Reason, DateTime CreatedAt, bool IsResolved,
    string? ResolutionAction,
    Guid ReporterId, string ReporterName,
    Guid? PhotoId, string? PhotoTitle,
    Guid? CommentId, string? CommentContent);

public record CreateReportDto(Guid ReporterId, Guid? PhotoId, Guid? CommentId, string Reason);


public interface ICommentService
{
    Task<List<CommentDto>> GetByPhotoAsync(Guid photoId, Guid? currentUserId = null);
    Task<ServiceResult<CommentDto>> CreateAsync(CreateCommentDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid commentId, Guid userId, bool isAdmin);

    Task<ServiceResult<bool>> RestoreAsync(Guid commentId);

    Task<ServiceResult<bool>> ReportPhotoAsync(CreateReportDto dto);
    Task<ServiceResult<bool>> ReportCommentAsync(CreateReportDto dto);
    Task<PaginatedDto<ReportDto>> GetReportsAsync(bool? resolved, int page, int pageSize);
    Task<ServiceResult<bool>> ResolveReportAsync(Guid reportId, string action = "Resolved");
    Task<int> GetUnresolvedReportCountAsync();
}


public class CommentService : ICommentService
{
    private readonly IApplicationDbContext _db;

    public CommentService(IApplicationDbContext db) => _db = db;

    public async Task<List<CommentDto>> GetByPhotoAsync(Guid photoId, Guid? currentUserId = null)
    {
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.PhotoId == photoId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id, c.Content, c.CreatedAt,
                c.IsReported && currentUserId.HasValue &&
                    _db.Reports.Any(r => r.CommentId == c.Id && r.ReporterId == currentUserId.Value),
                new CommentAuthorDto(c.Author.Id, c.Author.DisplayName)))
            .ToListAsync();
    }

    public async Task<ServiceResult<CommentDto>> CreateAsync(CreateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
            return ServiceResult<CommentDto>.Fail("Comment content is required.");

        if (dto.Content.Length > 1000)
            return ServiceResult<CommentDto>.Fail("Comment is too long (max 1000 characters).");

        var photoExists = await _db.Photos.AnyAsync(p => p.Id == dto.PhotoId);
        if (!photoExists)
            return ServiceResult<CommentDto>.Fail("Photo not found.");

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PhotoId = dto.PhotoId,
            AuthorId = dto.AuthorId,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        var author = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == dto.AuthorId)
            .Select(u => new CommentAuthorDto(u.Id, u.DisplayName))
            .FirstAsync();

        return ServiceResult<CommentDto>.Ok(
            new CommentDto(comment.Id, comment.Content, comment.CreatedAt, false, author));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid commentId, Guid userId, bool isAdmin)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment is null)
            return ServiceResult<bool>.Fail("Comment not found.");

        if (!isAdmin && comment.AuthorId != userId)
            return ServiceResult<bool>.Fail("Not authorized.");

        comment.IsDeleted = true;

        var reports = await _db.Reports
            .Where(r => r.CommentId == commentId && !r.IsResolved)
            .ToListAsync();
        foreach (var report in reports)
        {
            report.IsResolved = true;
            report.ResolutionAction = "Deleted";
        }

        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> RestoreAsync(Guid commentId)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment is null)
            return ServiceResult<bool>.Fail("Comment not found.");

        comment.IsDeleted = false;

        var reports = await _db.Reports
            .Where(r => r.CommentId == commentId && r.ResolutionAction == "Deleted")
            .ToListAsync();
        foreach (var report in reports)
            report.ResolutionAction = "Restored";

        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> ReportPhotoAsync(CreateReportDto dto)
    {
        if (!dto.PhotoId.HasValue)
            return ServiceResult<bool>.Fail("PhotoId is required.");

        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == dto.PhotoId.Value);
        if (photo is null)
            return ServiceResult<bool>.Fail("Photo not found.");

        photo.IsReported = true;

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = dto.ReporterId,
            PhotoId = dto.PhotoId,
            Reason = dto.Reason.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> ReportCommentAsync(CreateReportDto dto)
    {
        if (!dto.CommentId.HasValue)
            return ServiceResult<bool>.Fail("CommentId is required.");

        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == dto.CommentId.Value);
        if (comment is null)
            return ServiceResult<bool>.Fail("Comment not found.");

        comment.IsReported = true;

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = dto.ReporterId,
            PhotoId = comment.PhotoId,
            CommentId = dto.CommentId,
            Reason = dto.Reason.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<PaginatedDto<ReportDto>> GetReportsAsync(bool? resolved, int page, int pageSize)
    {
        var q = _db.Reports.AsNoTracking();

        if (resolved.HasValue)
            q = q.Where(r => r.IsResolved == resolved.Value);

        var totalCount = await q.CountAsync();

        var reports = await q
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportDto(
                r.Id, r.Reason, r.CreatedAt, r.IsResolved,
                r.ResolutionAction,
                r.ReporterId, r.Reporter.DisplayName,
                r.PhotoId, r.Photo != null ? r.Photo.Title : null,
                r.CommentId, r.Comment != null ? r.Comment.Content : null))
            .ToListAsync();

        return new PaginatedDto<ReportDto>(totalCount, page, pageSize, reports);
    }

    public async Task<ServiceResult<bool>> ResolveReportAsync(Guid reportId, string action = "Resolved")
    {
        var report = await _db.Reports.FirstOrDefaultAsync(r => r.Id == reportId);
        if (report is null)
            return ServiceResult<bool>.Fail("Report not found.");

        report.IsResolved = true;
        report.ResolutionAction = action;
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<int> GetUnresolvedReportCountAsync()
    {
        return await _db.Reports.CountAsync(r => !r.IsResolved);
    }
}
