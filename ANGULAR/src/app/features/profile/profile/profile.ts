import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormField,
  form,
  required,
  maxLength,
  minLength,
  pattern,
  submit,
} from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { Api } from '../../../core/api';
import { Session } from '../../../core/session';
import { Notifications } from '../../../core/notifications';
import { errorMessage } from '../../../core/auth-interceptor';
import type { Profile as UserProfile, Page, RoadmapSummary } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { RoadmapCard } from '../../../shared/roadmap-card/roadmap-card';
@Component({
  selector: 'app-profile',
  imports: [FormField, Icon, RoadmapCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page">
    @if (profile.isLoading()) {
      <div class="loading-state" role="status">Carregando perfil…</div>
    } @else if (profile.error()) {
      <div class="error-panel">
        <p>{{ errorMessage(profile.error()) }}</p>
        <button class="button secondary" (click)="profile.reload()">Tentar novamente</button>
      </div>
    } @else if (profile.value(); as person) {
      <div class="profile-layout">
        <aside class="panel profile-summary">
          <span class="avatar large">{{ person.name.slice(0, 1) }}</span>
          <h1>{{ person.name }}</h1>
          <p>{{ person.bio || 'Sempre há algo novo para aprender.' }}</p>
          <div class="person-stats">
            <span
              ><strong>{{ person.followers }}</strong> seguidores</span
            ><span
              ><strong>{{ person.following }}</strong> seguindo</span
            >
          </div>
          @if (!own()) {
            <button class="button primary full-width" [disabled]="busy()" (click)="follow(true)">
              <app-icon name="plus" />Seguir pessoa</button
            ><button
              class="text-button"
              style="margin-top:15px"
              [disabled]="busy()"
              (click)="follow(false)"
            >
              Deixar de seguir
            </button>
          } @else {
            <p class="hint">Seu nome e sua bio aparecem no seu perfil público.</p>
          }
        </aside>
        <section>
          @if (own()) {
            <form class="panel" (submit)="save($event)" novalidate>
              <h2>Um pouco sobre você</h2>
              <p>Compartilhe os interesses que fazem parte do seu caminho.</p>
              <label>Nome<input autocomplete="name" [formField]="fields.name" /></label
              ><label
                >Bio<textarea
                  rows="4"
                  [formField]="fields.bio"
                  placeholder="O que desperta sua curiosidade?"
                ></textarea></label
              ><button class="button primary" [disabled]="busy() || !fields().valid()">
                Salvar perfil
              </button>
            </form>
          }
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
          <div class="section-heading" style="margin-top:30px">
            <div>
              <h2>Trilhas compartilhadas</h2>
              <p>Conhecimento que pode abrir novos caminhos.</p>
            </div>
            <span class="soft-badge">{{ person.publicRoadmaps }} públicas</span>
          </div>
          @if (roadmaps.isLoading()) {
            <p role="status">Carregando trilhas…</p>
          } @else if (roadmaps.error()) {
            <p class="error">
              {{ errorMessage(roadmaps.error()) }}
              <button class="text-button" (click)="roadmaps.reload()">Tentar novamente</button>
            </p>
          } @else {
            <div class="card-grid profile-cards">
              @for (r of roadmaps.value()?.items; track r.id) {
                <app-roadmap-card [roadmap]="r" />
              } @empty {
                <div class="empty-state">
                  <app-icon name="map" />
                  <h2>Novos caminhos estão por vir</h2>
                  <p>Este perfil ainda não publicou trilhas.</p>
                </div>
              }
            </div>
            <div class="pagination">
              <button
                class="button secondary"
                [disabled]="page() === 1"
                (click)="page.set(page() - 1)"
              >
                Anterior</button
              ><span>{{ page() }}</span
              ><button
                class="button secondary"
                [disabled]="!roadmaps.value()?.hasMore"
                (click)="page.set(page() + 1)"
              >
                Próxima
              </button>
            </div>
          }
        </section>
      </div>
    }
  </div>`,
  styles: `
    .profile-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 600px) {
      .profile-cards {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Profile {
  private api = inject(Api);
  readonly session = inject(Session);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notices = inject(Notifications);
  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly id = computed(() => this.params().get('id') ?? this.session.user()?.id);
  readonly own = computed(() => this.id() === this.session.user()?.id);
  readonly profile = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.get<UserProfile>('/users/' + params),
  });
  readonly page = signal(1);
  readonly roadmaps = resource({
    params: () => (this.id() ? { authorId: this.id()!, page: this.page(), limit: 6 } : undefined),
    loader: ({ params }) => this.api.get<Page<RoadmapSummary>>('/explore/roadmaps', params),
  });
  readonly model = signal({ name: '', bio: '' });
  readonly fields = form(this.model, (s) => {
    required(s.name);
    minLength(s.name, 2);
    maxLength(s.name, 80);
    pattern(s.name, /\S/);
    maxLength(s.bio, 1000);
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly errorMessage = errorMessage;
  constructor() {
    effect(() => {
      const user = this.session.user();
      if (user && this.own()) this.model.set({ name: user.name, bio: user.bio });
    });
  }
  save(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    void submit(this.fields, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        await this.session.update(this.model());
        this.profile.reload();
        this.notices.show('Perfil atualizado.');
      } catch (e) {
        this.error.set(errorMessage(e));
      } finally {
        this.busy.set(false);
      }
    });
  }
  async follow(enabled: boolean) {
    if (!this.session.user()) {
      void this.router.navigate(['/entrar'], { queryParams: { next: this.router.url } });
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const path = '/users/' + this.id() + '/follow';
      if (enabled) await this.api.put(path);
      else await this.api.delete(path);
      this.profile.reload();
      this.notices.show(
        enabled ? 'Você está seguindo esta pessoa.' : 'Você deixou de seguir esta pessoa.',
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
