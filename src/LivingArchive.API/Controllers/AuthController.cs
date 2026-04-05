using System.Security.Claims;
using LivingArchive.Application.Auth;
using LivingArchive.Application.Interfaces;
using LivingArchive.Application.Services;
using LivingArchive.Domain.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LivingArchive.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly JwtSettings _jwtSettings;
    private readonly IUserService _userService;
    private readonly string _clientUrl;

    public AuthController(
        IApplicationDbContext db,
        ITokenService tokenService,
        IOptions<JwtSettings> jwtSettings,
        IUserService userService,
        IConfiguration configuration)
    {
        _db = db;
        _tokenService = tokenService;
        _jwtSettings = jwtSettings.Value;
        _userService = userService;
        _clientUrl = configuration["ClientUrl"] ?? "http://localhost:4200";
    }

    [HttpGet("login/{provider}")]
    [AllowAnonymous]
    public IActionResult ExternalLogin(string provider)
    {
        var scheme = provider.ToLowerInvariant() switch
        {
            "google" => GoogleDefaults.AuthenticationScheme,
            _ => null
        };

        if (scheme is null)
            return BadRequest(new { error = "Unsupported authentication provider." });

        var redirectUrl = Url.Action(nameof(ExternalLoginCallback));
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, scheme);
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLoginCallback()
    {
        var result = await HttpContext.AuthenticateAsync("ExternalCookie");
        if (!result.Succeeded || result.Principal is null)
            return Unauthorized(new { error = "External authentication failed." });

        var email = result.Principal.FindFirstValue(ClaimTypes.Email);
        var name = result.Principal.FindFirstValue(ClaimTypes.Name)
                   ?? result.Principal.FindFirstValue(ClaimTypes.GivenName)
                   ?? "User";

        if (string.IsNullOrEmpty(email))
            return BadRequest(new { error = "Email not provided by the authentication provider." });

        var user = await _userService.FindOrCreateByEmailAsync(email, name);
        if (user is null)
            return StatusCode(500, new { error = "Could not create user account." });

        if (user.IsBlocked)
            return Redirect($"{_clientUrl}/auth/callback?error=blocked");

        var authResult = await GenerateTokens(user);

        var redirectUrl = $"{_clientUrl}/auth/callback" +
            $"?accessToken={Uri.EscapeDataString(authResult.AccessToken!)}" +
            $"&refreshToken={Uri.EscapeDataString(authResult.RefreshToken!)}";

        return Redirect(redirectUrl);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var storedToken = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
            return Unauthorized(new { error = "Invalid or expired refresh token." });

        storedToken.IsRevoked = true;

        var authResult = await GenerateTokens(storedToken.User);
        return Ok(authResult);
    }

    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke([FromBody] RefreshRequest request)
    {
        var storedToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken);

        if (storedToken is null)
            return NotFound(new { error = "Token not found." });

        storedToken.IsRevoked = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Token revoked." });
    }

    private async Task<AuthResult> GenerateTokens(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshTokenValue = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResult
        {
            Success = true,
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes)
        };
    }
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
