import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (blocked()) {
      <div class="flex items-center justify-center min-h-[60vh] px-6">
        <div class="bg-error-container text-on-error-container rounded-2xl p-10 max-w-lg w-full text-center shadow-lg">
          <span
            class="material-symbols-outlined text-5xl mb-4"
            style="font-variation-settings:'FILL' 1"
            aria-hidden="true">block</span>
          <h1 class="font-headline font-black text-2xl mb-3">Konto zablokowane</h1>
          <p class="font-body leading-relaxed mb-6">
            Twoje konto zostało zablokowane przez administratora.
            Jeśli uważasz, że to pomyłka, skontaktuj się z administracją serwisu.
          </p>
          <a
            routerLink="/explore"
            class="inline-block bg-error text-on-error font-bold py-3 px-8 rounded-lg hover:bg-error/90 transition-colors">
            Wróć do strony głównej
          </a>
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-center min-h-[60vh]">
        <p class="text-on-surface-variant font-body text-lg">Logowanie...</p>
      </div>
    }
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly blocked = signal(false);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    if (params['error'] === 'blocked') {
      this.blocked.set(true);
      return;
    }

    const accessToken = params['accessToken'];
    const refreshToken = params['refreshToken'];

    if (accessToken && refreshToken) {
      this.auth.setTokens(accessToken, refreshToken);
    }

    this.router.navigate(['/explore']);
  }
}
