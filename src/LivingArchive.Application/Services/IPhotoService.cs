using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;
using LivingArchive.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Services;

public record PhotoDto(
    Guid Id, string Title, string Description, string? PhotoDate,
    string? FilePath, double? Latitude, double? Longitude,
    string Status, DateTime CreatedAt, DateTime? UpdatedAt, string Location);

public record PhotoSearchItemDto(
    Guid Id, string Title, string Description, string? PhotoDate,
    string? FilePath, double? Latitude, double? Longitude,
    string Status, DateTime CreatedAt, string Location, string Uploader);

public record AdminPhotoDto(
    Guid Id, string Title, string Description, string? PhotoDate,
    string? FilePath, string Status, DateTime CreatedAt,
    Guid HierarchyNodeId, string Location,
    AdminUploaderDto Uploader);

public record AdminUploaderDto(Guid Id, string DisplayName, string Email);

public record PaginatedDto<T>(int TotalCount, int Page, int PageSize, List<T> Data);

public record SearchPhotosQuery(
    string? Query, string? Period, Guid? LocationId,
    int Page = 1, int PageSize = 20);

public record CreatePhotoDto(
    Guid UploaderId, Guid HierarchyNodeId,
    string Title, string? Description, string? PhotoDate,
    string? FilePath);

public record UpdatePhotoDto(string? Title, string? Description, string? PhotoDate);

public record AdminEditPhotoDto(
    string? Title, string? Description, string? PhotoDate, Guid? HierarchyNodeId);

public interface IPhotoService
{
    Task<PaginatedDto<PhotoSearchItemDto>> SearchAsync(SearchPhotosQuery query);
    Task<PhotoSearchItemDto?> GetPublicPhotoAsync(Guid photoId);
    Task<List<PhotoDto>> GetUserPhotosAsync(Guid userId, int page, int pageSize);
    Task<PhotoDto?> GetUserPhotoAsync(Guid photoId, Guid userId);
    Task<ServiceResult<PhotoDto>> CreateAsync(CreatePhotoDto dto);
    Task<ServiceResult<PhotoDto>> UpdateAsync(Guid photoId, Guid userId, UpdatePhotoDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid photoId, Guid userId);
    Task<bool> LocationExistsAsync(Guid hierarchyNodeId);

    Task<PaginatedDto<AdminPhotoDto>> AdminGetAllAsync(string? status, string? query, int page, int pageSize);
    Task<ServiceResult<bool>> AdminEditMetadataAsync(Guid photoId, AdminEditPhotoDto dto);
    Task<ServiceResult<string>> AdminSetStatusAsync(Guid photoId, string status);
    Task<ServiceResult<string?>> AdminDeleteAsync(Guid photoId);
    Task<ServiceResult<bool>> AdminRestoreAsync(Guid photoId);
}

public class PhotoService : IPhotoService
{
    private readonly IApplicationDbContext _db;

    public PhotoService(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedDto<PhotoSearchItemDto>> SearchAsync(SearchPhotosQuery query)
    {
        var q = _db.Photos
            .AsNoTracking()
            .Where(p => p.Status != PhotoStatus.Rejected);

        if (!string.IsNullOrWhiteSpace(query.Query))
            q = q.Where(p => p.Title.Contains(query.Query) || p.Description.Contains(query.Query));

        if (!string.IsNullOrWhiteSpace(query.Period))
            q = q.Where(p => p.PhotoDate != null && p.PhotoDate.Contains(query.Period));

        if (query.LocationId.HasValue)
        {
            var descendantIds = await _db.HierarchyNodes
                .AsNoTracking()
                .Where(h => h.Id == query.LocationId.Value
                         || h.ParentId == query.LocationId.Value
                         || h.Parent!.ParentId == query.LocationId.Value)
                .Select(h => h.Id)
                .ToListAsync();

            q = q.Where(p => descendantIds.Contains(p.HierarchyNodeId));
        }

        var totalCount = await q.CountAsync();

        var photos = await q
            .OrderByDescending(p => p.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new PhotoSearchItemDto(
                p.Id, p.Title, p.Description, p.PhotoDate,
                p.FilePath, p.HierarchyNode.Latitude, p.HierarchyNode.Longitude,
                p.Status.ToString(), p.CreatedAt,
                p.HierarchyNode.Name, p.Uploader.DisplayName))
            .ToListAsync();

        return new PaginatedDto<PhotoSearchItemDto>(totalCount, query.Page, query.PageSize, photos);
    }

    public async Task<PhotoSearchItemDto?> GetPublicPhotoAsync(Guid photoId)
    {
        return await _db.Photos
            .AsNoTracking()
            .Where(p => p.Id == photoId && p.Status != PhotoStatus.Rejected)
            .Select(p => new PhotoSearchItemDto(
                p.Id, p.Title, p.Description, p.PhotoDate,
                p.FilePath, p.HierarchyNode.Latitude, p.HierarchyNode.Longitude,
                p.Status.ToString(), p.CreatedAt,
                p.HierarchyNode.Name, p.Uploader.DisplayName))
            .FirstOrDefaultAsync();
    }

    public async Task<List<PhotoDto>> GetUserPhotosAsync(Guid userId, int page, int pageSize)
    {
        return await _db.Photos
            .AsNoTracking()
            .Where(p => p.UploaderId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PhotoDto(
                p.Id, p.Title, p.Description, p.PhotoDate,
                p.FilePath, p.HierarchyNode.Latitude, p.HierarchyNode.Longitude,
                p.Status.ToString(), p.CreatedAt, p.UpdatedAt,
                p.HierarchyNode.Name))
            .ToListAsync();
    }

    public async Task<PhotoDto?> GetUserPhotoAsync(Guid photoId, Guid userId)
    {
        return await _db.Photos
            .AsNoTracking()
            .Where(p => p.Id == photoId && p.UploaderId == userId)
            .Select(p => new PhotoDto(
                p.Id, p.Title, p.Description, p.PhotoDate,
                p.FilePath, p.HierarchyNode.Latitude, p.HierarchyNode.Longitude,
                p.Status.ToString(), p.CreatedAt, p.UpdatedAt,
                p.HierarchyNode.Name))
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceResult<PhotoDto>> CreateAsync(CreatePhotoDto dto)
    {
        var photo = new Photo
        {
            Id = Guid.NewGuid(),
            UploaderId = dto.UploaderId,
            HierarchyNodeId = dto.HierarchyNodeId,
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            PhotoDate = dto.PhotoDate,
            FilePath = dto.FilePath,
            Status = PhotoStatus.Approved,
            CreatedAt = DateTime.UtcNow
        };

        _db.Photos.Add(photo);
        await _db.SaveChangesAsync();

        return ServiceResult<PhotoDto>.Ok(new PhotoDto(
            photo.Id, photo.Title, photo.Description, photo.PhotoDate,
            photo.FilePath, null, null,
            photo.Status.ToString(), photo.CreatedAt, null, ""));
    }

    public async Task<ServiceResult<PhotoDto>> UpdateAsync(Guid photoId, Guid userId, UpdatePhotoDto dto)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId && p.UploaderId == userId);
        if (photo is null)
            return ServiceResult<PhotoDto>.Fail("Photo not found.");

        photo.Title = dto.Title ?? photo.Title;
        photo.Description = dto.Description ?? photo.Description;
        photo.PhotoDate = dto.PhotoDate ?? photo.PhotoDate;
        photo.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ServiceResult<PhotoDto>.Ok(new PhotoDto(
            photo.Id, photo.Title, photo.Description, photo.PhotoDate,
            photo.FilePath, null, null,
            photo.Status.ToString(), photo.CreatedAt, photo.UpdatedAt, ""));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid photoId, Guid userId)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId && p.UploaderId == userId);
        if (photo is null)
            return ServiceResult<bool>.Fail("Photo not found.");

        _db.Photos.Remove(photo);
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<bool> LocationExistsAsync(Guid hierarchyNodeId)
    {
        return await _db.HierarchyNodes.AnyAsync(h => h.Id == hierarchyNodeId);
    }

    public async Task<PaginatedDto<AdminPhotoDto>> AdminGetAllAsync(string? status, string? query, int page, int pageSize)
    {
        var q = _db.Photos.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PhotoStatus>(status, true, out var parsed))
            q = q.Where(p => p.Status == parsed);

        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(p => p.Title.Contains(query) || p.Description.Contains(query));

        var totalCount = await q.CountAsync();

        var photos = await q
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminPhotoDto(
                p.Id, p.Title, p.Description, p.PhotoDate,
                p.FilePath, p.Status.ToString(), p.CreatedAt,
                p.HierarchyNodeId, p.HierarchyNode.Name,
                new AdminUploaderDto(p.Uploader.Id, p.Uploader.DisplayName, p.Uploader.Email)))
            .ToListAsync();

        return new PaginatedDto<AdminPhotoDto>(totalCount, page, pageSize, photos);
    }

    public async Task<ServiceResult<bool>> AdminEditMetadataAsync(Guid photoId, AdminEditPhotoDto dto)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null)
            return ServiceResult<bool>.Fail("Photo not found.");

        photo.Title = dto.Title ?? photo.Title;
        photo.Description = dto.Description ?? photo.Description;
        photo.PhotoDate = dto.PhotoDate ?? photo.PhotoDate;

        if (dto.HierarchyNodeId.HasValue)
        {
            var nodeExists = await _db.HierarchyNodes.AnyAsync(h => h.Id == dto.HierarchyNodeId.Value);
            if (!nodeExists)
                return ServiceResult<bool>.Fail("Invalid location.");
            photo.HierarchyNodeId = dto.HierarchyNodeId.Value;
        }

        photo.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<string>> AdminSetStatusAsync(Guid photoId, string status)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null)
            return ServiceResult<string>.Fail("Photo not found.");

        if (!Enum.TryParse<PhotoStatus>(status, true, out var newStatus))
            return ServiceResult<string>.Fail("Invalid status. Use: Pending, Approved, Rejected.");

        photo.Status = newStatus;
        photo.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ServiceResult<string>.Ok(newStatus.ToString());
    }

    public async Task<ServiceResult<string?>> AdminDeleteAsync(Guid photoId)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null)
            return ServiceResult<string?>.Fail("Photo not found.");

        photo.Status = PhotoStatus.Rejected;
        photo.UpdatedAt = DateTime.UtcNow;

        var reports = await _db.Reports
            .Where(r => r.PhotoId == photoId && !r.IsResolved)
            .ToListAsync();
        foreach (var report in reports)
        {
            report.IsResolved = true;
            report.ResolutionAction = "Deleted";
        }

        await _db.SaveChangesAsync();

        return ServiceResult<string?>.Ok(null);
    }

    public async Task<ServiceResult<bool>> AdminRestoreAsync(Guid photoId)
    {
        var photo = await _db.Photos.FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null)
            return ServiceResult<bool>.Fail("Photo not found.");

        photo.Status = PhotoStatus.Approved;
        photo.UpdatedAt = DateTime.UtcNow;

        var reports = await _db.Reports
            .Where(r => r.PhotoId == photoId && r.ResolutionAction == "Deleted")
            .ToListAsync();
        foreach (var report in reports)
            report.ResolutionAction = "Restored";

        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }
}
