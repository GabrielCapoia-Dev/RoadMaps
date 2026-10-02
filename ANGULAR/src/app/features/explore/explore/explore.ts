import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  resource,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { errorMessage } from '../../../core/auth-interceptor';
import { templates, templateRoadmap } from '../../../core/templates';
import type { Page, RoadmapSummary } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { RoadmapCard } from '../../../shared/roadmap-card/roadmap-card';
@Component({
  selector: 'app-explore',
  imports: [RouterLink, FormField, Icon, RoadmapCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page explore-page">
    <section class="explore-hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="live-dot"></span> UM MUNDO DE POSSIBILIDADES</span>
        <h1>Seu próximo passo<br />começa <span>aqui.</span></h1>
        <p>
          Descubra caminhos, conecte ideias e transforme<br class="desktop-break" />
          curiosidade em conhecimento. No seu ritmo.
        </p>
        <a routerLink="/meus-roadmaps" [queryParams]="{ criar: 'sim' }" class="button primary"
          >Crie sua primeira trilha <app-icon name="arrow" /></a
        ><span class="hero-footnote">Seu conhecimento. Seu caminho.</span>
      </div>
      <div class="hero-illustration" aria-hidden="true">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <svg viewBox="0 0 390 250">
          <path
            d="M192 82v32q0 20-20 20H95q-20 0-20 20v18 M192 82v32q0 20 20 20h78q20 0 20 20v18 M75 205v24h235v-24"
            fill="none"
            stroke="#9eafe0"
            stroke-width="2"
            stroke-dasharray="5 5"
          />
        </svg>
        <div class="hero-node node-start">
          <span class="tile teal"><app-icon name="sparkles" /></span>
          <div><small>TUDO COMEÇA COM</small><strong>Uma ideia</strong></div>
          <span class="node-status"></span>
        </div>
        <div class="hero-node node-learn">
          <span class="tile blue"><app-icon name="book" /></span><strong>Aprender</strong
          ><span class="tiny-progress"></span>
        </div>
        <div class="hero-node node-create">
          <span class="tile coral"><app-icon name="layers" /></span><strong>Criar</strong
          ><span class="tiny-progress"></span>
        </div>
        <div class="floating-dot dot-teal"></div>
        <div class="floating-dot dot-coral"></div>
        <span class="floating-plus">+</span>
      </div>
    </section>
    <section class="discovery" aria-labelledby="discover-title">
      <div class="section-heading">
        <div>
          <h2 id="discover-title">Encontre sua próxima descoberta</h2>
          <p>Existe uma trilha para cada nova versão de você.</p>
        </div>
      </div>
      <div class="category-list" aria-label="Categorias">
        @for (item of categories; track item.name) {
          <button
            [class.selected]="category() === item.value"
            (click)="choose(item.value)"
            [attr.aria-pressed]="category() === item.value"
          >
            <span [class]="'category-icon ' + item.color"><app-icon [name]="item.icon" /></span
            >{{ item.name }}
          </button>
        }
      </div>
      <div class="results-toolbar">
        <div class="tabs">
          <button [class.active]="filters().sort === 'trending'" (click)="sort('trending')">
            Em alta</button
          ><button [class.active]="filters().sort === 'newest'" (click)="sort('newest')">
            Novidades</button
          ><button [class.active]="filters().sort === 'popular'" (click)="sort('popular')">
            Mais seguidos
          </button>
        </div>
        <label class="inline-search"
          ><app-icon name="search" /><input
            [formField]="searchForm.q"
            placeholder="Filtrar modelos"
            aria-label="Filtrar modelos de inspiração"
        /></label>
      </div>
      @if (query()) {
        <p class="search-summary">
          Resultados para <strong>“{{ query() }}”</strong>
          <button class="text-button" (click)="clearQuery()">Limpar busca</button>
        </p>
      }
      @if (publicRoadmaps.isLoading()) {
        <div class="loading-state" role="status">
          <span class="spinner"></span>Buscando trilhas da comunidade…
        </div>
      } @else if (publicRoadmaps.error()) {
        <div class="error-panel" role="alert">
          <p>{{ errorMessage(publicRoadmaps.error()) }}</p>
          <button class="button secondary" (click)="publicRoadmaps.reload()">
            Tentar novamente
          </button>
        </div>
      } @else if (publicRoadmaps.value()?.items?.length) {
        <div class="card-grid">
          @for (roadmap of publicRoadmaps.value()!.items; track roadmap.id; let i = $index) {
            <app-roadmap-card [roadmap]="roadmap" [theme]="themes[i % themes.length]" />
          }
        </div>
        <div class="pagination">
          <button
            class="button secondary"
            [disabled]="page() === 1"
            (click)="page.update(previous)"
          >
            Anterior</button
          ><span>Página {{ page() }}</span
          ><button
            class="button secondary"
            [disabled]="!publicRoadmaps.value()?.hasMore"
            (click)="page.update(next)"
          >
            Próxima
          </button>
        </div>
      } @else {
        <div class="community-empty">
          <app-icon name="users" />
          <div>
            <strong>{{
              query() || category()
                ? 'Nenhuma trilha pública encontrada.'
                : 'A próxima descoberta pode ser sua.'
            }}</strong
            ><span>{{
              query() || category()
                ? 'Experimente outro tema ou categoria.'
                : 'Crie e publique uma trilha para inspirar outras pessoas.'
            }}</span>
          </div>
          <a routerLink="/meus-roadmaps" [queryParams]="{ criar: 'sim' }" class="text-link"
            >Criar roadmap <app-icon name="arrow"
          /></a>
        </div>
      }
    </section>
    <section aria-labelledby="templates-title">
      <div class="section-heading">
        <div>
          <div class="eyebrow">UM PONTO DE PARTIDA</div>
          <h2 id="templates-title">Inspiração para começar</h2>
          <p>Modelos editáveis para você construir uma trilha com a sua cara.</p>
        </div>
        <span class="soft-badge">{{ inspirations().length }} modelos</span>
      </div>
      <div class="card-grid">
        @for (item of inspirations(); track item.template.slug) {
          <app-roadmap-card
            [roadmap]="item.roadmap"
            [template]="true"
            [theme]="item.template.theme"
            [icon]="item.template.icon"
          />
        } @empty {
          <p class="empty-state">Nenhum modelo para este filtro. Explore as outras categorias.</p>
        }
      </div>
    </section>
    <section class="bottom-banner">
      <span class="banner-icon"><app-icon name="users" /></span>
      <div>
        <h2>Conhecimento bom é conhecimento compartilhado.</h2>
        <p>Encontre pessoas curiosas como você e construa novas conexões.</p>
      </div>
      <a routerLink="/comunidade" class="button secondary"
        >Conhecer a comunidade <app-icon name="arrow"
      /></a>
    </section>
  </div>`,
})
export class Explore {
  private api = inject(Api);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly query = computed(() => this.params().get('q') ?? '');
  readonly category = signal('');
  readonly page = signal(1);
  readonly filters = signal({ sort: 'trending' });
  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);
  readonly publicRoadmaps = resource({
    params: () => ({
      q: this.query(),
      category: this.category(),
      sort: this.filters().sort,
      page: this.page(),
      limit: 6,
    }),
    loader: ({ params }) => this.api.get<Page<RoadmapSummary>>('/explore/roadmaps', params),
  });
  readonly inspirations = computed(() =>
    templates
      .filter(
        (t) =>
          (!this.category() || t.category === this.category()) &&
          [t.title, t.category, t.description]
            .join(' ')
            .toLocaleLowerCase('pt-BR')
            .includes((this.searchModel().q || this.query()).toLocaleLowerCase('pt-BR')),
      )
      .map((template) => ({ template, roadmap: templateRoadmap(template) })),
  );
  readonly categories = [
    { name: 'Todos', value: '', icon: 'compass', color: 'blue' },
    { name: 'Tecnologia', value: 'Tecnologia', icon: 'code', color: 'teal' },
    { name: 'Carreira', value: 'Carreira', icon: 'briefcase', color: 'amber' },
    { name: 'Criatividade', value: 'Criatividade', icon: 'sparkles', color: 'violet' },
    { name: 'Idiomas', value: 'Idiomas', icon: 'globe', color: 'coral' },
    {
      name: 'Desenvolvimento pessoal',
      value: 'Desenvolvimento pessoal',
      icon: 'sun',
      color: 'teal',
    },
  ];
  readonly themes = ['blue', 'teal', 'coral', 'violet', 'amber', 'mint'];
  readonly errorMessage = errorMessage;
  readonly previous = (n: number) => n - 1;
  readonly next = (n: number) => n + 1;
  choose(value: string) {
    this.category.set(value);
    this.page.set(1);
  }
  sort(value: string) {
    this.filters.set({ sort: value });
    this.page.set(1);
  }
  clearQuery() {
    void this.router.navigate(['/explorar']);
  }
}
