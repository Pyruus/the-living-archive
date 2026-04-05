using LivingArchive.Application.Interfaces;
using LivingArchive.Domain.Entities;
using LivingArchive.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.Application.Services;

public record UserDto(
    Guid Id, string Email, string DisplayName,
    string Role, bool IsBlocked, DateTime CreatedAt, int PhotoCount);

public record UserSummaryDto(Guid Id, string DisplayName, bool IsBlocked);

public interface IUserService
{
    Task<PaginatedDto<UserDto>> GetAllAsync(string? query, bool? isBlocked, int page, int pageSize);
    Task<ServiceResult<UserSummaryDto>> BlockAsync(Guid userId);
    Task<ServiceResult<UserSummaryDto>> UnblockAsync(Guid userId);
    Task<User?> FindOrCreateByEmailAsync(string email, string displayName);
}

public class UserService : IUserService
{
    private readonly IApplicationDbContext _db;

    public UserService(IApplicationDbContext db) => _db = db;

    public async Task<PaginatedDto<UserDto>> GetAllAsync(string? query, bool? isBlocked, int page, int pageSize)
    {
        var q = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(u => u.DisplayName.Contains(query) || u.Email.Contains(query));

        if (isBlocked.HasValue)
            q = q.Where(u => u.IsBlocked == isBlocked.Value);

        var totalCount = await q.CountAsync();

        var users = await q
            .OrderBy(u => u.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(
                u.Id, u.Email, u.DisplayName,
                u.Role.ToString(), u.IsBlocked, u.CreatedAt,
                u.Photos.Count))
            .ToListAsync();

        return new PaginatedDto<UserDto>(totalCount, page, pageSize, users);
    }

    public async Task<ServiceResult<UserSummaryDto>> BlockAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            return ServiceResult<UserSummaryDto>.Fail("User not found.");

        user.IsBlocked = true;
        await _db.SaveChangesAsync();

        return ServiceResult<UserSummaryDto>.Ok(
            new UserSummaryDto(user.Id, user.DisplayName, user.IsBlocked));
    }

    public async Task<ServiceResult<UserSummaryDto>> UnblockAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            return ServiceResult<UserSummaryDto>.Fail("User not found.");

        user.IsBlocked = false;
        await _db.SaveChangesAsync();

        return ServiceResult<UserSummaryDto>.Ok(
            new UserSummaryDto(user.Id, user.DisplayName, user.IsBlocked));
    }

    public async Task<User?> FindOrCreateByEmailAsync(string email, string displayName)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is not null) return user;

        user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = displayName,
            Role = UserRole.Creator,
            IsBlocked = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}
