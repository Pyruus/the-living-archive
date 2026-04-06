import { Injectable, signal, computed } from '@angular/core';

const TOKEN_KEY = 'la-access-token';
const REFRESH_KEY = 'la-refresh-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isLoggedIn = computed(() => !!this.token());
  readonly userRole = computed(() => this.parseClaimFromToken('role'));
  readonly isAdmin = computed(() => this.userRole() === 'Admin');
  readonly userName = computed(() => this.parseClaimFromToken('name'));
  readonly userId = computed(() => this.parseClaimFromToken('sub'));

  /** Called by OAuth callback or external login flow to store tokens */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    this.token.set(accessToken);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.token.set(null);
  }

  getToken(): string | null {
    return this.token();
  }

  private parseClaimFromToken(claim: string): string | null {
    const token = this.token();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (claim === 'role') {
        return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          ?? payload['role']
          ?? null;
      }
      if (claim === 'name') {
        return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
          ?? payload['name']
          ?? null;
      }

      return payload[claim] ?? null;
    } catch {
      return null;
    }
  }
}
