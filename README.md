# The Living Archive

Społecznościowe archiwum cyfrowe — aplikacja webowa umożliwiająca przesyłanie, katalogowanie i eksplorację historycznych fotografii z terenu Polski i Europy.

## Stos technologiczny

- **Frontend:** Angular 19, Tailwind CSS 4, Leaflet.js
- **Backend:** .NET 8, ASP.NET Core Web API, Entity Framework Core
- **Baza danych:** PostgreSQL 16
- **Uwierzytelnianie:** OAuth 2.0 (Google) + JWT

## Wymagania

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) i npm
- [PostgreSQL 16](https://www.postgresql.org/)
- Angular CLI (`npm install -g @angular/cli`)

## Uruchomienie

### 1. Baza danych

```bash
createdb living_archive
```

### 2. Backend

```bash
cd src/LivingArchive.API

# Konfiguracja User Secrets
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=living_archive;Username=USERNAME;Password=TWOJE_HASLO"
dotnet user-secrets set "Jwt:Secret" "TWOJ_KLUCZ_MIN_32_ZNAKI"
dotnet user-secrets set "Jwt:Issuer" "LivingArchive"
dotnet user-secrets set "Jwt:Audience" "LivingArchive"
dotnet user-secrets set "OAuth:Google:ClientId" "TWOJ_CLIENT_ID"
dotnet user-secrets set "OAuth:Google:ClientSecret" "TWOJ_CLIENT_SECRET"

# Migracje
dotnet ef database update --project ../LivingArchive.Infrastructure

# Uruchomienie
dotnet run
```

### 3. Frontend

```bash
cd client
npm install
ng serve
```

Aplikacja dostępna pod `http://localhost:4200`.

## Struktura projektu

```
├── src/
│   ├── LivingArchive.Domain/          # Encje, enumy
│   ├── LivingArchive.Application/     # Interfejsy serwisów, DTO, logika biznesowa
│   ├── LivingArchive.Infrastructure/  # EF Core, konfiguracje, implementacje serwisów
│   └── LivingArchive.API/             # Kontrolery, middleware, Program.cs
├── client/
│   └── src/app/
│       ├── core/                      # Serwisy, modele, stałe, interceptory
│       ├── features/                  # Strony: explore, upload, collection, admin, auth
│       └── shared/                    # Komponenty współdzielone: mapa, location-browser
├── seed.sql                           # Seed: lokalizacje, użytkownicy, zdjęcia Krakowa
└── seed-extra.sql                     # Seed: dodatkowe zdjęcia dla pozostałych lokalizacji
```
