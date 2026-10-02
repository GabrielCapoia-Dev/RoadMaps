import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class TokenStore {
  readonly token = signal<string | undefined>(this.read());
  private read(): string | undefined {
    try {
      const saved = JSON.parse(sessionStorage.getItem('breadcrumbs.session') ?? 'null') as {
        token?: string;
        expires?: string;
      } | null;
      return saved?.token && saved.expires && Date.parse(saved.expires) > Date.now()
        ? saved.token
        : undefined;
    } catch {
      return undefined;
    }
  }
  set(token: string, expires: string) {
    this.token.set(token);
    try {
      sessionStorage.setItem('breadcrumbs.session', JSON.stringify({ token, expires }));
    } catch {
      /* Session remains available in memory. */
    }
  }
  clear() {
    this.token.set(undefined);
    try {
      sessionStorage.removeItem('breadcrumbs.session');
    } catch {
      /* Storage may be unavailable. */
    }
  }
}
