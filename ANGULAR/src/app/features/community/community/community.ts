import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { errorMessage } from '../../../core/auth-interceptor';
import type { Page, Profile } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
@Component({
  selector: 'app-community',
  imports: [RouterLink, FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page">
    <div class="page-heading">
      <div>
        <span class="eyebrow">CONEXÕES QUE ABREM CAMINHOS</span>
        <h1>Aprender é melhor junto.</h1>
        <p>Conheça pessoas, descubra perspectivas e encontre novas inspirações.</p>
      </div>
      <span class="tile teal"><app-icon name="users" /></span>
    </div>
    <form class="panel" (submit)="search($event)" style="display:flex;gap:12px;margin-bottom:25px">
      <input
        [formField]="fields.q"
        aria-label="Buscar pessoas"
        placeholder="Quem você quer encontrar?"
      /><button class="button primary"><app-icon name="search" />Buscar</button>
    </form>
    @if (people.isLoading()) {
      <div class="loading-state" role="status">
        <span class="spinner"></span>Encontrando mentes curiosas…
      </div>
    } @else if (people.error()) {
      <div class="error-panel">
        <p>{{ errorMessage(people.error()) }}</p>
        <button class="button secondary" (click)="people.reload()">Tentar novamente</button>
      </div>
    } @else {
      <div class="people-grid">
        @for (person of people.value()?.items; track person.id) {
          <article class="panel person-card">
            <span class="avatar large">{{ person.name.slice(0, 1) }}</span>
            <h2>{{ person.name }}</h2>
            <p>{{ person.bio || 'Uma mente curiosa construindo novos caminhos.' }}</p>
            <div class="person-stats">
              <span
                ><strong>{{ person.publicRoadmaps }}</strong> trilhas públicas</span
              ><span
                ><strong>{{ person.followers }}</strong> seguidores</span
              >
            </div>
            <a class="button secondary" [routerLink]="['/pessoas', person.id]"
              >Conhecer perfil <app-icon name="arrow"
            /></a>
          </article>
        } @empty {
          <div class="empty-state">
            <app-icon name="users" />
            <h2>Nenhuma pessoa encontrada</h2>
            <p>Tente buscar outro nome.</p>
          </div>
        }
      </div>
      <div class="pagination">
        <button class="button secondary" [disabled]="page() === 1" (click)="page.set(page() - 1)">
          Anterior</button
        ><span>Página {{ page() }}</span
        ><button
          class="button secondary"
          [disabled]="!people.value()?.hasMore"
          (click)="page.set(page() + 1)"
        >
          Próxima
        </button>
      </div>
    }
  </div>`,
})
export class Community {
  private api = inject(Api);
  readonly model = signal({ q: '' });
  readonly fields = form(this.model);
  readonly query = signal('');
  readonly page = signal(1);
  readonly errorMessage = errorMessage;
  readonly people = resource({
    params: () => ({ q: this.query(), page: this.page(), limit: 12 }),
    loader: ({ params }) => this.api.get<Page<Profile>>('/users', params),
  });
  search(event: Event) {
    event.preventDefault();
    this.query.set(this.model().q);
    this.page.set(1);
  }
}
