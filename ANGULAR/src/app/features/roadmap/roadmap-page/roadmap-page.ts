import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form, required, maxLength, submit } from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { Session } from '../../../core/session';
import { Notifications } from '../../../core/notifications';
import { errorMessage } from '../../../core/auth-interceptor';
import { templates, templateRoadmap } from '../../../core/templates';
import type {
  Roadmap,
  Progress,
  Page,
  Comment,
  Reactions,
  StudyStatus,
} from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { GraphCanvas } from '../../../shared/graph-canvas/graph-canvas';
@Component({
  selector: 'app-roadmap-page',
  imports: [RouterLink, FormField, DatePipe, Icon, GraphCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="page">
    <a class="text-link" routerLink="/explorar"><app-icon name="back" />Voltar para explorar</a>
    @if (data.isLoading()) {
      <div class="loading-state" role="status">
        <span class="spinner"></span>Preparando sua trilha…
      </div>
    } @else if (data.error()) {
      <div class="error-panel" role="alert">
        <h2>Não foi possível abrir esta trilha</h2>
        <p>{{ errorMessage(data.error()) }}</p>
        <button class="button secondary" (click)="data.reload()">Tentar novamente</button>
      </div>
    } @else if (data.value(); as roadmap) {
      <div class="detail-cover card-art blue" style="margin-top:24px">
        <span class="art-circle"></span><span class="art-line"></span
        ><span class="art-diamond"></span><app-icon name="map" /><span class="art-label">{{
          roadmap.category
        }}</span>
      </div>
      <div class="detail-title">
        <div>
          <div class="eyebrow">
            {{
              isTemplate()
                ? 'MODELO DE INSPIRAÇÃO'
                : roadmap.visibility === 'public'
                  ? 'TRILHA PÚBLICA'
                  : 'TRILHA PRIVADA'
            }}
          </div>
          <h1>{{ roadmap.title }}</h1>
          <p class="detail-description">{{ roadmap.description }}</p>
        </div>
        @if (isTemplate()) {
          <button class="button primary" [disabled]="busy()" (click)="useTemplate()">
            Usar este modelo <app-icon name="arrow" />
          </button>
        } @else if (roadmap.access?.canEdit) {
          <a class="button primary" [routerLink]="['/editor', roadmap.id]"
            ><app-icon name="edit" />Editar roadmap</a
          >
        }
      </div>
      <div class="tags">
        @for (tag of roadmap.tags; track tag) {
          <span class="tag">{{ tag }}</span>
        }
      </div>
      <div class="detail-author">
        <span class="avatar">{{ roadmap.authorName.slice(0, 1) }}</span>
        @if (!isTemplate()) {
          <a [routerLink]="['/pessoas', roadmap.ownerId]">{{ roadmap.authorName }}</a>
        } @else {
          <span>BreadCrumbs · Modelo editável</span>
        }
        <span class="muted">· {{ roadmap.graph.nodes.length }} etapas</span>
      </div>
      @if (isTemplate()) {
        <div class="hint">
          <app-icon name="sparkles" />Este modelo é um ponto de partida. Use-o para criar uma cópia
          privada e personalizar suas etapas.
        </div>
      } @else {
        <div class="detail-actions">
          <button
            class="button secondary"
            [disabled]="busy()"
            [attr.aria-pressed]="has('like')"
            (click)="react('like')"
          >
            <app-icon name="heart" />{{ has('like') ? 'Curtido' : 'Curtir' }} ·
            {{ social.error() ? 0 : (social.value()?.likes ?? 0) }}</button
          ><button
            class="button secondary"
            [disabled]="busy()"
            [attr.aria-pressed]="has('favorite')"
            (click)="react('favorite')"
          >
            <app-icon name="bookmark" />{{ has('favorite') ? 'Salvo' : 'Salvar' }}</button
          ><button
            class="button secondary"
            [disabled]="busy()"
            [attr.aria-pressed]="has('follow')"
            (click)="react('follow')"
          >
            <app-icon name="plus" />{{ has('follow') ? 'Seguindo' : 'Seguir trilha' }}</button
          ><button class="button secondary" (click)="share()">
            <app-icon name="share" />Copiar link
          </button>
        </div>
        @if (social.error()) {
          <p class="error" role="alert">
            Não foi possível carregar as interações.
            <button class="text-button" (click)="social.reload()">Tentar novamente</button>
          </p>
        }
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <div class="tabs" style="margin-bottom:20px;border-bottom:1px solid var(--border)">
        <button [class.active]="tab() === 'steps'" (click)="tab.set('steps')">
          Etapas da trilha</button
        ><button [class.active]="tab() === 'graph'" (click)="tab.set('graph')">
          Mapa de conhecimento
        </button>
        @if (!isTemplate()) {
          <button [class.active]="tab() === 'comments'" (click)="tab.set('comments')">
            Conversa da comunidade
          </button>
        }
      </div>
      <div class="detail-grid">
        <section>
          @if (tab() === 'graph') {
            <app-graph-canvas
              [graph]="roadmap.graph"
              [selected]="selected()"
              (selectedChange)="selectNode($event)"
            />
          }
          @if (tab() === 'steps' || tab() === 'graph') {
            <div class="node-list">
              @for (node of roadmap.graph.nodes; track node.id; let i = $index) {
                @if (tab() === 'steps' || selected() === node.id) {
                  <article class="study-row">
                    <span class="step-number">{{ i + 1 }}</span>
                    <div>
                      <h3>{{ node.title }}</h3>
                      <p>{{ node.description }}</p>
                      <small class="muted">{{ node.required ? 'Essencial' : 'Opcional' }}</small>
                      @if (node.resources.length) {
                        <ul class="resource-list">
                          @for (material of node.resources; track $index) {
                            <li>
                              <a [href]="material.url" target="_blank" rel="noopener noreferrer"
                                >{{ material.label }} ↗</a
                              >
                            </li>
                          }
                        </ul>
                      }
                    </div>
                    @if (session.user() && !isTemplate()) {
                      <div class="status-actions" [attr.aria-label]="'Progresso de ' + node.title">
                        @for (status of statuses; track status.value) {
                          <button
                            class="status-chip"
                            [class.active]="nodeStatus(node.id) === status.value"
                            [attr.aria-pressed]="nodeStatus(node.id) === status.value"
                            [disabled]="busy() || progress.isLoading() || !!progress.error()"
                            (click)="setProgress(node.id, status.value)"
                          >
                            {{ status.label }}
                          </button>
                        }
                      </div>
                    }
                  </article>
                }
              } @empty {
                <div class="empty-state">
                  <h2>Esta trilha está começando</h2>
                  <p>As etapas aparecerão aqui quando forem adicionadas.</p>
                </div>
              }
            </div>
          }
          @if (tab() === 'comments') {
            @if (session.user() && roadmap.access?.canComment) {
              <form class="panel" (submit)="comment($event)">
                <label
                  >Compartilhe uma ideia<textarea
                    [formField]="commentFields.body"
                    rows="3"
                    placeholder="Uma dúvida, uma descoberta, uma dica…"
                  ></textarea>
                </label>
                @if (replyTo()) {
                  <p class="hint">
                    Respondendo a um comentário
                    <button class="text-button" type="button" (click)="replyTo.set('')">
                      Cancelar
                    </button>
                  </p>
                }
                <button class="button primary" [disabled]="busy() || !commentFields().valid()">
                  Publicar comentário
                </button>
              </form>
            } @else {
              <p class="hint">
                {{
                  session.user()
                    ? 'Você tem acesso de leitura a esta trilha.'
                    : 'Entre na sua conta para participar da conversa.'
                }}
              </p>
            }
            @if (comments.isLoading()) {
              <p class="loading-state">Carregando comentários…</p>
            } @else if (comments.error()) {
              <p class="error">
                {{ errorMessage(comments.error()) }}
                <button class="text-button" (click)="comments.reload()">Tentar novamente</button>
              </p>
            } @else {
              @for (item of comments.value()?.items; track item.id) {
                <article class="comment" [class.reply]="!!item.parentId">
                  <div class="comment-top">
                    <span class="avatar small">{{ item.authorName.slice(0, 1) }}</span
                    ><a [routerLink]="['/pessoas', item.authorId]">{{ item.authorName }}</a
                    ><span class="muted">{{ item.createdAt | date: 'dd/MM/yyyy' }}</span>
                  </div>
                  <p>{{ item.body }}</p>
                  <div class="detail-actions">
                    @if (!item.parentId && roadmap.access?.canComment) {
                      <button class="text-button" (click)="replyTo.set(item.id)">Responder</button>
                    }
                    @if (item.authorId === session.user()?.id || roadmap.access?.canManage) {
                      <button
                        class="text-button"
                        [disabled]="busy()"
                        (click)="deleteComment(item.id)"
                      >
                        Excluir
                      </button>
                    }
                  </div>
                </article>
              } @empty {
                <div class="empty-state">
                  <app-icon name="message" />
                  <h2>A conversa começa com você</h2>
                  <p>Compartilhe uma pergunta ou descoberta sobre esta trilha.</p>
                </div>
              }
              <div class="pagination">
                <button
                  class="button secondary"
                  [disabled]="commentPage() === 1"
                  (click)="commentPage.set(commentPage() - 1)"
                >
                  Anterior</button
                ><span>{{ commentPage() }}</span
                ><button
                  class="button secondary"
                  [disabled]="!comments.value()?.hasMore"
                  (click)="commentPage.set(commentPage() + 1)"
                >
                  Próxima
                </button>
              </div>
            }
          }
        </section>
        <aside class="panel progress-panel">
          <h2>{{ isTemplate() ? 'Faça do seu jeito' : 'Seu progresso' }}</h2>
          @if (isTemplate()) {
            <p>
              Adapte os temas, adicione seus materiais e encontre o ritmo que funciona para você.
            </p>
            <button class="button primary full-width" [disabled]="busy()" (click)="useTemplate()">
              Criar minha cópia
            </button>
          } @else if (!session.user()) {
            <p>Entre para registrar cada etapa e acompanhar sua evolução.</p>
            <a
              class="button primary full-width"
              routerLink="/entrar"
              [queryParams]="{ next: currentUrl() }"
              >Entrar e começar</a
            >
          } @else if (progress.error()) {
            <p class="error">{{ errorMessage(progress.error()) }}</p>
            <button class="button secondary" (click)="progress.reload()">Tentar novamente</button>
          } @else if (progress.isLoading()) {
            <p role="status">Carregando progresso…</p>
          } @else {
            <span class="progress-number">{{ progress.value()?.percent ?? 0 }}%</span>
            <div
              class="progress-track"
              role="progressbar"
              [attr.aria-valuenow]="progress.value()?.percent ?? 0"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Etapas concluídas"
            >
              <span [style.width.%]="progress.value()?.percent ?? 0"></span>
            </div>
            <p>
              <strong>{{ progress.value()?.completed ?? 0 }}</strong> de
              {{ progress.value()?.total ?? 0 }} etapas concluídas
            </p>
            <p class="hint">Pequenos passos, grandes descobertas. Seu progresso é individual.</p>
          }
        </aside>
      </div>
    }
  </div>`,
  styles: `
    .status-actions {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      max-width: 140px;
    }
    .status-chip {
      font-size: 9px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: white;
      padding: 5px 6px;
    }
    .status-chip.active {
      background: var(--pale);
      border-color: var(--blue);
      color: var(--blue);
    }
    .progress-panel {
      height: fit-content;
    }
  `,
})
export class RoadmapPage {
  private api = inject(Api);
  readonly session = inject(Session);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notices = inject(Notifications);
  private params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly id = computed(() => this.params().get('id') ?? '');
  readonly isTemplate = signal(this.route.snapshot.data['template'] === true);
  readonly currentUrl = () => this.router.url;
  readonly data = resource({
    params: () => ({ id: this.id(), user: this.session.user()?.id }),
    loader: async ({ params }) => {
      if (this.isTemplate()) {
        const template = templates.find((t) => t.slug === params.id);
        if (!template) throw new Error('Modelo não encontrado.');
        return templateRoadmap(template);
      }
      return this.api.get<Roadmap>('/roadmaps/' + params.id);
    },
  });
  readonly progress = resource({
    params: () =>
      !this.isTemplate() && this.session.user()
        ? { id: this.id(), user: this.session.user()!.id }
        : undefined,
    loader: ({ params }) => this.api.get<Progress>('/roadmaps/' + params.id + '/progress/me'),
  });
  readonly social = resource({
    params: () =>
      !this.isTemplate() ? { id: this.id(), user: this.session.user()?.id } : undefined,
    loader: ({ params }) => this.api.get<Reactions>('/roadmaps/' + params.id + '/reactions'),
  });
  readonly commentPage = signal(1);
  readonly tab = signal('steps');
  readonly comments = resource({
    params: () =>
      !this.isTemplate() && this.tab() === 'comments'
        ? { id: this.id(), page: this.commentPage() }
        : undefined,
    loader: ({ params }) =>
      this.api.get<Page<Comment>>('/roadmaps/' + params.id + '/comments', {
        page: params.page,
        limit: 20,
      }),
  });
  readonly selected = signal('');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly replyTo = signal('');
  readonly commentModel = signal({ body: '' });
  readonly commentFields = form(this.commentModel, (s) => {
    required(s.body);
    maxLength(s.body, 4000);
  });
  readonly errorMessage = errorMessage;
  readonly statuses: { value: StudyStatus; label: string }[] = [
    { value: 'not_started', label: 'Não iniciado' },
    { value: 'in_progress', label: 'Estudando' },
    { value: 'completed', label: 'Concluído' },
  ];
  has(kind: string) {
    return !this.social.error() && !!this.social.value()?.mine.includes(kind);
  }
  nodeStatus(id: string) {
    return this.progress.error()
      ? 'not_started'
      : (this.progress.value()?.nodes.find((n) => n.nodeId === id)?.status ?? 'not_started');
  }
  selectNode(id: string) {
    this.selected.set(id);
  }
  private requireLogin() {
    if (this.session.user()) return true;
    void this.router.navigate(['/entrar'], { queryParams: { next: this.router.url } });
    return false;
  }
  async useTemplate() {
    if (!this.requireLogin() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const template = this.data.value()!;
      const created = await this.api.post<Roadmap>('/roadmaps', {
        title: template.title,
        description: template.description,
        category: template.category,
        tags: template.tags,
      });
      await this.api.put('/roadmaps/' + created.id + '/graph', {
        expectedRevision: created.revision,
        graph: template.graph,
      });
      await this.router.navigate(['/editor', created.id]);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async react(kind: string) {
    if (!this.requireLogin() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const path = '/roadmaps/' + this.id() + '/reactions/' + kind;
      if (this.has(kind)) await this.api.delete(path);
      else await this.api.put(path);
      this.social.set(await this.api.get<Reactions>('/roadmaps/' + this.id() + '/reactions'));
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async setProgress(id: string, status: StudyStatus) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      this.progress.set(
        await this.api.put<Progress>('/roadmaps/' + this.id() + '/progress/me/nodes/' + id, {
          status,
        }),
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async share() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.notices.show(
        this.data.value()?.visibility === 'private'
          ? 'Link copiado. Apenas pessoas com acesso poderão abrir.'
          : 'Link copiado para compartilhar.',
      );
    } catch {
      this.error.set('Não foi possível copiar. Copie o endereço na barra do navegador.');
    }
  }
  comment(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    void submit(this.commentFields, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        await this.api.post('/roadmaps/' + this.id() + '/comments', {
          body: this.commentModel().body,
          ...(this.replyTo() ? { parentId: this.replyTo() } : {}),
        });
        this.commentModel.set({ body: '' });
        this.replyTo.set('');
        this.comments.reload();
      } catch (e) {
        this.error.set(errorMessage(e));
      } finally {
        this.busy.set(false);
      }
    });
  }
  async deleteComment(id: string) {
    if (!window.confirm('Excluir este comentário e suas respostas?')) return;
    this.busy.set(true);
    try {
      await this.api.delete('/roadmaps/' + this.id() + '/comments/' + id);
      this.comments.reload();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
