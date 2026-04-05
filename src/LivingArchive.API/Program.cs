using System.Text;
using LivingArchive.API.Auth;
using LivingArchive.Application.Auth;
using LivingArchive.Infrastructure;
using LivingArchive.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Clean Architecture: Infrastructure layer (DbContext, repositories)
// ---------------------------------------------------------------------------
builder.Services.AddInfrastructure(builder.Configuration);

// ---------------------------------------------------------------------------
// JWT Settings
// ---------------------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection(JwtSettings.SectionName);
builder.Services.Configure<JwtSettings>(jwtSection);
var jwtSettings = jwtSection.Get<JwtSettings>()!;

// ---------------------------------------------------------------------------
// Authentication: JWT Bearer (primary) + Google OAuth2 (external)
// ---------------------------------------------------------------------------
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = "ExternalCookie";
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ClockSkew = TimeSpan.Zero
        };
    })
    .AddCookie("ExternalCookie", options =>
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["OAuth:Google:ClientId"] ?? "";
        options.ClientSecret = builder.Configuration["OAuth:Google:ClientSecret"] ?? "";
        options.CallbackPath = "/api/auth/google-callback";
        options.SignInScheme = "ExternalCookie";
    });

// ---------------------------------------------------------------------------
// Authorization: policies with IsBlocked check
// ---------------------------------------------------------------------------
builder.Services.AddScoped<IAuthorizationHandler, NotBlockedHandler>();

builder.Services.AddAuthorization(options =>
{
    // Creator: must be Creator role + NOT blocked
    options.AddPolicy(PolicyConstants.RequireCreator, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("Creator");
        policy.Requirements.Add(new NotBlockedRequirement());
    });

    // Admin: must be Admin role
    options.AddPolicy(PolicyConstants.RequireAdmin, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("Admin");
    });

    // Creator OR Admin: both can upload/edit, but blocked creators are denied
    options.AddPolicy(PolicyConstants.RequireCreatorOrAdmin, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole("Creator", "Admin");
        policy.Requirements.Add(new NotBlockedRequirement());
    });
});

// ---------------------------------------------------------------------------
// Token service (Infrastructure)
// ---------------------------------------------------------------------------
builder.Services.AddScoped<ITokenService, TokenService>();

// ---------------------------------------------------------------------------
// Controllers & Swagger
// ---------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---------------------------------------------------------------------------
// CORS – allow Angular dev server
// ---------------------------------------------------------------------------
var clientUrl = builder.Configuration["ClientUrl"] ?? "http://localhost:4200";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(clientUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("AllowAngularDev");
}

app.UseHttpsRedirection();

// Serve uploaded photos from /uploads
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
