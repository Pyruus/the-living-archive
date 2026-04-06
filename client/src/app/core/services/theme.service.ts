import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'high-contrast';

const STORAGE_KEY = 'la-theme';
const THEME_CLASSES: Theme[] = ['light', 'dark', 'high-contrast'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Reactive signal holding the active theme */
  readonly theme = signal<Theme>(this.loadInitialTheme());

  /** Convenience computed booleans */
  readonly isDark = computed(() => this.theme() === 'dark');
  readonly isHighContrast = computed(() => this.theme() === 'high-contrast');

  /** Human-readable label for the active theme (for ARIA announcements) */
  readonly themeLabel = computed(() => {
    const labels: Record<Theme, string> = {
      light: 'Tryb jasny',
      dark: 'Tryb ciemny',
      'high-contrast': 'Tryb wysokiego kontrastu',
    };
    return labels[this.theme()];
  });

  constructor() {
    effect(() => {
      const active = this.theme();
      const html = document.documentElement;

      THEME_CLASSES.forEach((t) => html.classList.remove(t));
      html.classList.add(active);
      localStorage.setItem(STORAGE_KEY, active);
      this.announceToScreenReader(`Zmieniono motyw na: ${this.themeLabel()}`);
    });
  }

  /** Cycle through themes: light → dark → high-contrast → light */
  toggle(): void {
    const order: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = order.indexOf(this.theme());
    const next = order[(currentIndex + 1) % order.length];
    this.theme.set(next);
  }

  /** Set a specific theme */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /** Read initial theme from localStorage, OS preference, or default to light */
  private loadInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && THEME_CLASSES.includes(stored)) {
      return stored;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-contrast: more)').matches
    ) {
      return 'high-contrast';
    }

    return 'light';
  }

  /** Post a polite ARIA live announcement */
  private announceToScreenReader(message: string): void {
    const el = document.getElementById('aria-live-announcer');
    if (el) {
      el.textContent = '';
      setTimeout(() => (el.textContent = message), 100);
    }
  }
}
