import {
  effect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  form,
  FormField,
  required,
  maxLength,
  submit,
  debounce,
  pattern,
} from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { errorMessage } from '../../../core/auth-interceptor';
import type { Page, Roadmap, RoadmapSummary } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { RoadmapCard } from '../../../shared/roadmap-card/roadmap-card';
@Component({
  selector: 'app-library',
  imports: [RouterLink, FormField, Icon, RoadmapCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page">
      <div class="page-heading">
        <div>
          <span class="eyebrow">SEU ESPAÇO DE APRENDIZADO</span>
          <h1>{{ saved ? 'Suas próximas descobertas' : 'Meus roadmaps' }}</h1>
          <p>
            {{
              saved
                ? 'Guarde boas ideias. Volte a elas quando quiser.'
                : 'Organize suas ideias e continue construindo seu caminho.'
            }}
          </p>
        </div>
        <button class="button primary" (click)="openCreate()">
          <app-icon name="plus" />Criar roadmap
        </button>
      </div>
      <div class="results-toolbar">
        <div class="tabs">
          @for (tab of tabs; track tab.value) {
            <button
              [class.active]="filter() === tab.value"
              (click)="filter.set(tab.value); page.set(1)"
            >
              {{ tab.label }}
            </button>
          }
        </div>
        <label class="inline-search"
          ><app-icon name="search" /><input
            [formField]="searchFields.q"
            placeholder="Buscar nas suas trilhas"
            aria-label="Buscar nas suas trilhas"
        /></label>
      </div>
      @if (data.isLoading()) {
        <div class="loading-state" role="status">
          <span class="spinner"></span>Carregando seus roadmaps…
        </div>
      } @else if (data.error()) {
        <div class="error-panel" role="alert">
          <p>{{ errorMessage(data.error()) }}</p>
          <button class="button secondary" (click)="data.reload()">Tentar novamente</button>
        </div>
      } @else {
        <div class="card-grid">
          @for (roadmap of data.value()?.items; track roadmap.id; let i = $index) {
            <app-roadmap-card [roadmap]="roadmap" [theme]="themes[i % themes.length]" />
          } @empty {
            <div class="empty-state">
              <span class="empty-symbol"><app-icon name="map" /></span>
              <h2>Um espaço cheio de possibilidades</h2>
              <p>
                {{
                  filter() === 'owned'
                    ? 'Seu primeiro roadmap está a uma ideia de distância.'
                    : 'Nenhum roadmap encontrado nesta seleção.'
                }}
              </p>
              <a routerLink="/explorar" class="button secondary"
                >Explorar inspirações <app-icon name="arrow"
              /></a>
            </div>
          }
        </div>
        @if (data.value()?.items?.length) {
          <div class="pagination">
            <button
              class="button secondary"
              [disabled]="page() === 1"
              (click)="page.set(page() - 1)"
            >
              Anterior</button
            ><span>Página {{ page() }}</span
            ><button
              class="button secondary"
              [disabled]="!data.value()?.hasMore"
              (click)="page.set(page() + 1)"
            >
              Próxima
            </button>
          </div>
        }
      }
    </div>
    <dialog #createDialog>
      <div class="dialog-heading">
        <h2>Uma nova trilha</h2>
        <button class="icon-button" (click)="createDialog.close()" aria-label="Fechar">
          <app-icon name="x" />
        </button>
      </div>
      <p class="muted">Comece com uma ideia. Você poderá editar cada detalhe depois.</p>
      <form (submit)="create($event)" novalidate>
        <label
          >Título<input [formField]="fields.title" placeholder="O que você quer aprender?" /></label
        ><label
          >Descrição<textarea
            [formField]="fields.description"
            rows="3"
            placeholder="Conte um pouco sobre o objetivo desta trilha"
          ></textarea></label
        ><label
          >Categoria<input
            [formField]="fields.category"
            placeholder="Ex.: Tecnologia, Música, Idiomas"
            list="category-options" /></label
        ><datalist id="category-options">
          <option>Tecnologia</option>
          <option>Criatividade</option>
          <option>Idiomas</option>
          <option>Carreira</option>
          <option>Desenvolvimento pessoal</option>
        </datalist>
        <p class="hint">
          <app-icon name="lock" />Sua trilha começa privada. Você decide quando compartilhar.
        </p>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="button primary full-width" [disabled]="busy() || !fields().valid()">
          {{ busy() ? 'Criando…' : 'Criar e abrir editor' }}<app-icon name="arrow" />
        </button>
      </form>
    </dialog>`,
})
export class Library {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly saved = this.route.snapshot.data['saved'] === true;
  readonly filter = signal(this.saved ? 'favorite' : 'owned');
  readonly page = signal(1);
  readonly tabs = this.saved
    ? [
        { value: 'favorite', label: 'Favoritos' },
        { value: 'follow', label: 'Seguindo' },
      ]
    : [
        { value: 'owned', label: 'Criados por mim' },
        { value: 'shared', label: 'Compartilhados comigo' },
        { value: 'all', label: 'Todos' },
      ];
  readonly searchModel = signal({ q: '' });
  readonly searchFields = form(this.searchModel, (s) => debounce(s.q, 300));
  readonly data = resource({
    params: () => ({
      filter: this.filter(),
      q: this.searchModel().q,
      page: this.page(),
      limit: 12,
    }),
    loader: ({ params }) => this.api.get<Page<RoadmapSummary>>('/roadmaps', params),
  });
  readonly model = signal({ title: '', description: '', category: '' });
  readonly fields = form(this.model, (s) => {
    required(s.title);
    pattern(s.title, /\S/);
    maxLength(s.title, 160);
    maxLength(s.description, 5000);
    maxLength(s.category, 60);
  });
  readonly error = signal('');
  readonly busy = signal(false);
  readonly themes = ['blue', 'teal', 'coral', 'violet'];
  readonly errorMessage = errorMessage;
  private query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private dialog = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  constructor() {
    effect(() => {
      if (this.query().has('criar') && this.dialog()) this.openCreate();
    });
  }
  openCreate() {
    this.error.set('');
    this.dialog()!.nativeElement.showModal();
  }
  create(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    void submit(this.fields, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        const roadmap = await this.api.post<Roadmap>('/roadmaps', {
          ...this.model(),
          category: this.model().category.trim() || 'Geral',
        });
        this.dialog()!.nativeElement.close();
        await this.router.navigate(['/editor', roadmap.id]);
      } catch (e) {
        this.error.set(errorMessage(e));
      } finally {
        this.busy.set(false);
      }
    });
  }
}
