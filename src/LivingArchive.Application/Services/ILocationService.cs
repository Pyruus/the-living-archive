using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;
using LivingArchive.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Services;

public record LocationDto(
    Guid Id, Guid? ParentId, string Name, string Slug,
    string Level, double? Latitude, double? Longitude,
    int PhotoCount, int ChildCount);

public record CreateLocationDto(
    Guid? ParentId, string Name, string Level,
    double? Latitude, double? Longitude);

public record UpdateLocationDto(
    string? Name, double? Latitude, double? Longitude);

public record ServiceResult<T>(bool Success, T? Data = default, string? Error = null)
{
    public static ServiceResult<T> Ok(T data) => new(true, data);
    public static ServiceResult<T> Fail(string error) => new(false, Error: error);
}

public interface ILocationService
{
    Task<List<LocationDto>> GetAllAsync();
    Task<List<LocationDto>> GetPublicTreeAsync();
    Task<ServiceResult<LocationDto>> CreateAsync(CreateLocationDto dto);
    Task<ServiceResult<LocationDto>> UpdateAsync(Guid id, UpdateLocationDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
    Task<List<Guid>> GetDescendantIdsAsync(Guid locationId);
}

public class LocationService : ILocationService
{
    private readonly IApplicationDbContext _db;

    public LocationService(IApplicationDbContext db) => _db = db;

    public async Task<List<LocationDto>> GetAllAsync()
    {
        return await _db.HierarchyNodes
            .AsNoTracking()
            .OrderBy(h => h.Level)
            .ThenBy(h => h.Name)
            .Select(h => new LocationDto(
                h.Id, h.ParentId, h.Name, h.Slug,
                h.Level.ToString(), h.Latitude, h.Longitude,
                h.Photos.Count()
                    + h.Children.SelectMany(c => c.Photos).Count()
                    + h.Children.SelectMany(c => c.Children).SelectMany(gc => gc.Photos).Count(),
                h.Children.Count()))
            .ToListAsync();
    }

    public async Task<List<LocationDto>> GetPublicTreeAsync()
    {
        return await _db.HierarchyNodes
            .AsNoTracking()
            .OrderBy(h => h.Level)
            .ThenBy(h => h.Name)
            .Select(h => new LocationDto(
                h.Id, h.ParentId, h.Name, h.Slug,
                h.Level.ToString(), h.Latitude, h.Longitude,
                h.Photos.Count(p => p.Status != PhotoStatus.Rejected)
                    + h.Children.SelectMany(c => c.Photos).Count(p => p.Status != PhotoStatus.Rejected)
                    + h.Children.SelectMany(c => c.Children).SelectMany(gc => gc.Photos).Count(p => p.Status != PhotoStatus.Rejected),
                h.Children.Count()))
            .ToListAsync();
    }

    public async Task<ServiceResult<LocationDto>> CreateAsync(CreateLocationDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return ServiceResult<LocationDto>.Fail("Name is required.");

        if (!Enum.TryParse<HierarchyLevel>(dto.Level, true, out var level))
            return ServiceResult<LocationDto>.Fail("Invalid level. Use: Country, City, or District.");

        if (dto.ParentId.HasValue)
        {
            var parent = await _db.HierarchyNodes
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.Id == dto.ParentId.Value);

            if (parent is null)
                return ServiceResult<LocationDto>.Fail("Parent location not found.");

            var validChild = parent.Level switch
            {
                HierarchyLevel.Country => level == HierarchyLevel.City,
                HierarchyLevel.City => level == HierarchyLevel.District,
                _ => false
            };

            if (!validChild)
                return ServiceResult<LocationDto>.Fail("Invalid hierarchy. Country contains Cities, Cities contain Districts.");
        }
        else if (level != HierarchyLevel.Country)
        {
            return ServiceResult<LocationDto>.Fail("Only countries can be top-level locations.");
        }

        var slug = GenerateSlug(dto.Name);
        var baseSlug = slug;
        var counter = 1;
        while (await _db.HierarchyNodes.AnyAsync(h => h.Slug == slug))
            slug = $"{baseSlug}-{++counter}";

        var node = new HierarchyNode
        {
            Id = Guid.NewGuid(),
            ParentId = dto.ParentId,
            Name = dto.Name.Trim(),
            Slug = slug,
            Level = level,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude
        };

        _db.HierarchyNodes.Add(node);
        await _db.SaveChangesAsync();

        return ServiceResult<LocationDto>.Ok(new LocationDto(
            node.Id, node.ParentId, node.Name, node.Slug,
            node.Level.ToString(), node.Latitude, node.Longitude, 0, 0));
    }

    public async Task<ServiceResult<LocationDto>> UpdateAsync(Guid id, UpdateLocationDto dto)
    {
        var node = await _db.HierarchyNodes.FirstOrDefaultAsync(h => h.Id == id);
        if (node is null)
            return ServiceResult<LocationDto>.Fail("Location not found.");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            node.Name = dto.Name.Trim();
            var slug = GenerateSlug(node.Name);
            var baseSlug = slug;
            var counter = 1;
            while (await _db.HierarchyNodes.AnyAsync(h => h.Slug == slug && h.Id != id))
                slug = $"{baseSlug}-{++counter}";
            node.Slug = slug;
        }

        if (dto.Latitude.HasValue)
            node.Latitude = dto.Latitude;
        if (dto.Longitude.HasValue)
            node.Longitude = dto.Longitude;

        await _db.SaveChangesAsync();

        return ServiceResult<LocationDto>.Ok(new LocationDto(
            node.Id, node.ParentId, node.Name, node.Slug,
            node.Level.ToString(), node.Latitude, node.Longitude, 0, 0));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var node = await _db.HierarchyNodes
            .Include(h => h.Children)
            .Include(h => h.Photos)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (node is null)
            return ServiceResult<bool>.Fail("Location not found.");
        if (node.Children.Count > 0)
            return ServiceResult<bool>.Fail("Cannot delete a location that has child locations. Remove children first.");
        if (node.Photos.Count > 0)
            return ServiceResult<bool>.Fail("Cannot delete a location that has photos. Reassign or delete photos first.");

        _db.HierarchyNodes.Remove(node);
        await _db.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<List<Guid>> GetDescendantIdsAsync(Guid locationId)
    {
        return await _db.HierarchyNodes
            .AsNoTracking()
            .Where(h => h.Id == locationId
                     || h.ParentId == locationId
                     || h.Parent!.ParentId == locationId)
            .Select(h => h.Id)
            .ToListAsync();
    }

    public static string GenerateSlug(string name)
    {
        var normalized = name.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var slug = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        slug = slug.Replace('ł', 'l').Replace('Ł', 'l');
        slug = Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');
        return slug;
    }
}
