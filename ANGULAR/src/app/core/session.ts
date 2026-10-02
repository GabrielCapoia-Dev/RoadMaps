import { Injectable, computed, inject, signal } from '@angular/core';
import { Api } from './api';
import { TokenStore } from './token-store';
import type { User } from './models';
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly api = inject(Api);
  private readonly tokens = inject(TokenStore);
  private readonly profile = signal<User | undefined>(undefined);
  readonly user = computed(() => (this.tokens.token() ? this.profile() : undefined));
  readonly ready = signal(false);
  private restoring?: Promise<void>;
  restore(): Promise<void> {
    return (this.restoring ??= (async () => {
      try {
        if (this.tokens.token()) this.profile.set(await this.api.get<User>('/users/me'));
      } catch {
        this.profile.set(undefined);
      } finally {
        this.ready.set(true);
      }
    })());
  }
  async login(email: string, password: string) {
    const auth = await this.api.post<{ accessToken: string; expiresAt: string }>('/auth/login', {
      email,
      password,
    });
    await this.start(auth.accessToken, auth.expiresAt);
  }
  async start(accessToken: string, expiresAt: string) {
    this.tokens.set(accessToken, expiresAt);
    this.profile.set(await this.api.get<User>('/users/me'));
    this.ready.set(true);
  }
  async logout() {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.tokens.clear();
      this.profile.set(undefined);
    }
  }
  async update(body: { name?: string; bio?: string }) {
    this.profile.set(await this.api.patch<User>('/users/me', body));
  }
  async completeTour() {
    await this.api.put('/users/me/onboarding');
    this.profile.update((u) => (u ? { ...u, onboardingCompletedAt: new Date().toISOString() } : u));
  }
}
