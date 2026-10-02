import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiHealth } from '../../core/http/api-health';

@Component({
  imports: [],
  selector: 'app-environment-page',
  styleUrl: './environment-page.scss',
  templateUrl: './environment-page.html',
})
export class EnvironmentPage {
  private readonly apiHealth = inject(ApiHealth);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly status = signal<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');

  protected checkApi(): void {
    if (this.status() === 'checking') {
      return;
    }

    this.status.set('checking');
    this.apiHealth
      .check()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.status.set('ready'),
        error: () => this.status.set('unavailable'),
      });
  }
}
