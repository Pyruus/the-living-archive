using System.Security.Claims;
using LivingArchive.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace LivingArchive.API.Auth;

public class NotBlockedHandler : AuthorizationHandler<NotBlockedRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public NotBlockedHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        NotBlockedRequirement requirement)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)
                          ?? context.User.FindFirst("sub");

        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            context.Fail(new AuthorizationFailureReason(this, "User ID not found in token."));
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            context.Fail(new AuthorizationFailureReason(this, "User not found."));
            return;
        }

        if (user.IsBlocked)
        {
            context.Fail(new AuthorizationFailureReason(this, "User account is blocked."));
            return;
        }

        context.Succeed(requirement);
    }
}
