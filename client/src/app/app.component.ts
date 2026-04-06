import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <!-- Top Navigation Bar -->
    <header class="bg-surface-container-lowest sticky top-0 z-50 border-b border-outline-variant">
      <nav class="flex justify-between items-center w-full px-6 h-16 max-w-screen-2xl mx-auto"
           aria-label="Nawigacja główna">
        <div class="flex items-center gap-8 h-full">
          <a class="text-sm sm:text-lg md:text-2xl font-black text-primary tracking-tighter font-headline flex items-center"
             href="/"
             aria-label="The Living Archive – strona główna">
            The Living Archive
          </a>
          <div class="hidden md:flex gap-1 items-stretch h-full">
            <a routerLink="/explore"
               routerLinkActive="text-primary border-b-2 border-primary"
               class="flex items-center px-4 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
              Eksploruj
            </a>
            @if (auth.isLoggedIn()) {
              <a routerLink="/upload"
                 routerLinkActive="text-primary border-b-2 border-primary"
                 class="flex items-center px-4 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
                Dodaj zdjęcie
              </a>
              <a routerLink="/collection"
                 routerLinkActive="text-primary border-b-2 border-primary"
                 class="flex items-center px-4 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
                Moja kolekcja
              </a>
            }
            @if (auth.isAdmin()) {
              <a routerLink="/admin"
                 routerLinkActive="text-primary border-b-2 border-primary"
                 class="flex items-center px-4 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
                Admin
              </a>
            }
          </div>
        </div>
        <div class="flex items-center gap-4">
          @if (!auth.isLoggedIn()) {
            <a href="/api/auth/login/google"
               class="flex items-center text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
              Zaloguj się
            </a>
          } @else {
            <span class="text-sm text-on-surface-variant font-body hidden sm:flex items-center">
              {{ auth.userName() }}
            </span>
            <button
              (click)="auth.logout()"
              class="flex items-center text-sm font-bold text-on-surface-variant hover:text-primary transition-colors font-headline">
              Wyloguj
            </button>
          }
          <app-theme-toggle />
          <!-- Mobile menu button -->
          <button
            type="button"
            class="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            aria-label="Otwórz menu"
            [attr.aria-expanded]="mobileMenuOpen()"
            (click)="mobileMenuOpen.set(!mobileMenuOpen())">
            <span class="material-symbols-outlined text-2xl">
              {{ mobileMenuOpen() ? 'close' : 'menu' }}
            </span>
          </button>
        </div>
      </nav>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden border-t border-outline-variant bg-surface-container-lowest">
          <div class="flex flex-col px-6 py-4 gap-1">
            <a routerLink="/explore"
               routerLinkActive="text-primary bg-primary-container"
               class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors font-headline"
               (click)="mobileMenuOpen.set(false)">
              <span class="material-symbols-outlined text-lg">explore</span>
              Eksploruj
            </a>
            @if (auth.isLoggedIn()) {
              <a routerLink="/upload"
                 routerLinkActive="text-primary bg-primary-container"
                 class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors font-headline"
                 (click)="mobileMenuOpen.set(false)">
                <span class="material-symbols-outlined text-lg">add_photo_alternate</span>
                Dodaj zdjęcie
              </a>
              <a routerLink="/collection"
                 routerLinkActive="text-primary bg-primary-container"
                 class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors font-headline"
                 (click)="mobileMenuOpen.set(false)">
                <span class="material-symbols-outlined text-lg">photo_library</span>
                Moja kolekcja
              </a>
            }
            @if (auth.isAdmin()) {
              <a routerLink="/admin"
                 routerLinkActive="text-primary bg-primary-container"
                 class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors font-headline"
                 (click)="mobileMenuOpen.set(false)">
                <span class="material-symbols-outlined text-lg">admin_panel_settings</span>
                Admin
              </a>
            }
          </div>
        </div>
      }
    </header>

    <!-- Main content area -->
    <main id="main-content" class="flex-grow flex flex-col">
      <router-outlet />
    </main>

    <!-- Footer -->
    <footer class="bg-surface-container-low border-t border-outline-variant py-8 mt-auto">
      <div class="max-w-screen-2xl mx-auto px-6 text-center">
        <p class="text-on-surface-variant text-sm font-body">
          &copy; 2026 The Living Archive &mdash; Cyfrowe Archiwum Społecznościowe
        </p>
      </div>
    </footer>
  `,
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly mobileMenuOpen = signal(false);
}
