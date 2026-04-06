import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../../core/services/theme.service';

const THEMES: Theme[] = ['light', 'dark', 'high-contrast'];

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded-lg"
         role="radiogroup"
         aria-label="Wybierz motyw wizualny"
         (keydown)="onKeydown($event)">

      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.theme() === 'light'"
        aria-label="Tryb jasny"
        [attr.tabindex]="themeService.theme() === 'light' ? 0 : -1"
        [class.bg-primary]="themeService.theme() === 'light'"
        [class.text-on-primary]="themeService.theme() === 'light'"
        class="p-2 rounded transition-colors hover:bg-surface-container-highest"
        (click)="themeService.setTheme('light')">
        <span class="material-symbols-outlined text-xl" aria-hidden="true">light_mode</span>
      </button>

      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.theme() === 'dark'"
        aria-label="Tryb ciemny"
        [attr.tabindex]="themeService.theme() === 'dark' ? 0 : -1"
        [class.bg-primary]="themeService.theme() === 'dark'"
        [class.text-on-primary]="themeService.theme() === 'dark'"
        class="p-2 rounded transition-colors hover:bg-surface-container-highest"
        (click)="themeService.setTheme('dark')">
        <span class="material-symbols-outlined text-xl" aria-hidden="true">dark_mode</span>
      </button>

      <button
        type="button"
        role="radio"
        [attr.aria-checked]="themeService.theme() === 'high-contrast'"
        aria-label="Tryb wysokiego kontrastu"
        [attr.tabindex]="themeService.theme() === 'high-contrast' ? 0 : -1"
        [class.bg-primary]="themeService.theme() === 'high-contrast'"
        [class.text-on-primary]="themeService.theme() === 'high-contrast'"
        class="p-2 rounded transition-colors hover:bg-surface-container-highest"
        (click)="themeService.setTheme('high-contrast')">
        <span class="material-symbols-outlined text-xl" aria-hidden="true">contrast</span>
      </button>
    </div>
  `,
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  onKeydown(event: KeyboardEvent): void {
    const currentIndex = THEMES.indexOf(this.themeService.theme());
    let newIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = (currentIndex + 1) % THEMES.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = (currentIndex - 1 + THEMES.length) % THEMES.length;
    } else {
      return;
    }

    this.themeService.setTheme(THEMES[newIndex]);
    const buttons = (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[newIndex]?.focus();
  }
}
