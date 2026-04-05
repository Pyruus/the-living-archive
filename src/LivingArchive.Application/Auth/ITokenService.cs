using LivingArchive.Domain.Entities;

namespace LivingArchive.Application.Auth;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
