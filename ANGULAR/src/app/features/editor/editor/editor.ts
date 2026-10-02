import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, form, required, maxLength, pattern } from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { Notifications } from '../../../core/notifications';
import { errorMessage } from '../../../core/auth-interceptor';
import type { Graph, Roadmap, StudyNode } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { GraphCanvas } from '../../../shared/graph-canvas/graph-canvas';
import { NodeInspector } from '../node-inspector/node-inspector';
import { ShareDialog } from '../share-dialog/share-dialog';

@Component({
  selector: 'app-editor',
  imports: [RouterLink, FormField, Icon, GraphCanvas, NodeInspector, ShareDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` @if (loading()) {
      <div class="loading-state" role="status">
        <span class="spinner"></span>Abrindo seu espaço de criação…
      </div>
    } @else if (roadmap(); as r) {
      <header class="editor-heading">
        <a [routerLink]="['/roadmaps', r.id]" class="icon-button" aria-label="Voltar à trilha"
          ><app-icon name="back"
        /></a>
        <div>
          <h1>{{ r.title }}</h1>
          <p>
            {{ dirty() ? 'Alterações não salvas' : 'Tudo salvo' }} ·
            {{ r.visibility === 'private' ? 'Privado' : 'Público' }} · Revisão {{ r.revision }}
          </p>
        </div>
        <div class="editor-actions">
          @if (r.access?.canManage) {
            <button class="button secondary" (click)="sharing.set(true)">
              <app-icon name="users" />Compartilhar</button
            ><button class="button secondary" [disabled]="busy() || dirty()" (click)="publish()">
              <app-icon [name]="r.visibility === 'public' ? 'lock' : 'globe'" />{{
                r.visibility === 'public' ? 'Tornar privado' : 'Publicar'
              }}
            </button>
          }
          <button
            class="button primary"
            [disabled]="busy() || !dirty() || !metadataFields().valid() || inspectorDirty()"
            (click)="save()"
          >
            <app-icon name="save" />{{ busy() ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </div>
      </header>
      @if (error()) {
        <div class="error-panel" role="alert" style="margin:15px 20px">
          <p>{{ error() }}</p>
          @if (conflict()) {
            <button class="button secondary" (click)="exportDraft()">Baixar minha versão</button>
            <button class="button secondary" (click)="reload()">
              Recarregar versão do servidor
            </button>
          }
        </div>
      }
      <div class="editor-layout">
        <section class="editor-main" [attr.inert]="busy() ? '' : null">
          <div class="editor-toolbar">
            <button class="button secondary" (click)="addNode()">
              <app-icon name="plus" />Nova etapa</button
            ><button
              class="icon-button"
              aria-label="Desfazer"
              [disabled]="!undoStack().length || inspectorDirty()"
              (click)="undo()"
            >
              <app-icon name="undo" /></button
            ><button
              class="icon-button"
              aria-label="Refazer"
              [disabled]="!redoStack().length || inspectorDirty()"
              (click)="redo()"
            >
              <app-icon name="redo" /></button
            ><span class="soft-badge"
              >{{ graph().nodes.length }} etapas · {{ graph().edges.length }} conexões</span
            >
          </div>
          <app-graph-canvas
            [graph]="graph()"
            [editable]="!inspectorDirty()"
            [selected]="selected()"
            (selectedChange)="select($event)"
            (graphChange)="change($event)"
          />
          <p class="editor-help">
            Arraste as etapas e ligue os pontos para conectar ideias. Use os botões abaixo e o
            painel lateral para editar também pelo teclado.
          </p>
          @if (inspectorDirty()) {
            <p class="hint">Aplique os detalhes da etapa antes de salvar o roadmap.</p>
          }
          <div class="editor-node-choices" aria-label="Selecionar etapa">
            @for (node of graph().nodes; track node.id) {
              <button [class.active]="selected() === node.id" (click)="select(node.id)">
                {{ node.title }}
              </button>
            }
          </div>
          @if (!graph().nodes.length) {
            <div class="empty-state">
              <h2>Uma ideia vira um caminho</h2>
              <p>Adicione a primeira etapa e comece a conectar seu conhecimento.</p>
              <button class="button primary" (click)="addNode()">
                <app-icon name="plus" />Adicionar primeira etapa
              </button>
            </div>
          }
          <details class="panel" style="margin-top:22px">
            <summary>Conexões da trilha</summary>
            <form (submit)="connect($event)" style="margin-top:18px">
              <div class="two-fields">
                <label
                  >Etapa de origem<select [formField]="connectionFields.source">
                    <option value="">Selecione</option>
                    @for (node of graph().nodes; track node.id) {
                      <option [value]="node.id">{{ node.title }}</option>
                    }
                  </select></label
                ><label
                  >Próxima etapa<select [formField]="connectionFields.target">
                    <option value="">Selecione</option>
                    @for (node of graph().nodes; track node.id) {
                      <option [value]="node.id">{{ node.title }}</option>
                    }
                  </select></label
                >
              </div>
              <button
                class="button secondary"
                [disabled]="
                  !connectionModel().source ||
                  !connectionModel().target ||
                  connectionModel().source === connectionModel().target
                "
              >
                <app-icon name="link" />Conectar etapas
              </button>
            </form>
            <ul class="compact-list">
              @for (edge of graph().edges; track edge.id) {
                <li>
                  <span>{{ nodeTitle(edge.source) }} → {{ nodeTitle(edge.target) }}</span
                  ><button
                    class="icon-button"
                    aria-label="Remover conexão"
                    (click)="removeEdge(edge.id)"
                  >
                    <app-icon name="x" />
                  </button>
                </li>
              }
            </ul>
          </details>
        </section>
        <aside class="editor-inspector" [attr.inert]="busy() ? '' : null">
          @if (selectedNode(); as node) {
            <app-node-inspector
              [node]="node"
              (changed)="updateNode($event)"
              (draftChanged)="inspectorDirty.set($event)"
              (duplicate)="duplicateNode()"
              (remove)="removeNode()"
            />
          } @else {
            <span class="tile blue"><app-icon name="map" /></span>
            <h2 style="margin-top:15px">Seu mapa, suas ideias</h2>
            <p class="hint">Selecione uma etapa para editar seus detalhes e materiais de estudo.</p>
          }
          <details [open]="!selectedNode()">
            <summary>Sobre o roadmap</summary>
            <form>
              <label>Título<input [formField]="metadataFields.title" /></label
              ><label
                >Descrição<textarea
                  rows="4"
                  [formField]="metadataFields.description"
                ></textarea></label
              ><label>Categoria<input [formField]="metadataFields.category" /></label>
            </form>
          </details>
          @if (r.access?.canManage) {
            <details>
              <summary>Gerenciar trilha</summary>
              <p class="hint">
                A exclusão remove a trilha, os comentários e o progresso de todos os participantes.
              </p>
              <button class="button danger" (click)="removeRoadmap()">
                <app-icon name="trash" />Excluir roadmap
              </button>
            </details>
          }
        </aside>
      </div>
      @if (sharing()) {
        <app-share-dialog [roadmapId]="r.id" [ownerId]="r.ownerId" (closed)="sharing.set(false)" />
      }
    } @else {
      <div class="page">
        <div class="error-panel">
          <h1>Editor indisponível</h1>
          <p>{{ error() }}</p>
          <a routerLink="/meus-roadmaps" class="button secondary">Voltar à biblioteca</a
          ><button class="button secondary" (click)="load()">Tentar novamente</button>
        </div>
      </div>
    }`,
})
export class Editor {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notices = inject(Notifications);
  private destroyRef = inject(DestroyRef);
  private id = this.route.snapshot.paramMap.get('id')!;
  readonly roadmap = signal<Roadmap | undefined>(undefined);
  readonly graph = signal<Graph>({ nodes: [], edges: [] });
  readonly selected = signal('');
  readonly selectedNode = computed(() => this.graph().nodes.find((n) => n.id === this.selected()));
  readonly metadata = signal({ title: '', description: '', category: '' });
  readonly metadataFields = form(this.metadata, (s) => {
    required(s.title);
    pattern(s.title, /\S/);
    maxLength(s.title, 160);
    maxLength(s.description, 10000);
    required(s.category);
    maxLength(s.category, 60);
  });
  readonly connectionModel = signal({ source: '', target: '' });
  readonly connectionFields = form(this.connectionModel);
  private baseline = signal('');
  readonly inspectorDirty = signal(false);
  readonly dirty = computed(
    () =>
      !!this.roadmap() &&
      (this.inspectorDirty() ||
        this.baseline() !== JSON.stringify({ graph: this.graph(), metadata: this.metadata() })),
  );
  readonly undoStack = signal<Graph[]>([]);
  readonly redoStack = signal<Graph[]>([]);
  readonly busy = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly conflict = signal(false);
  readonly sharing = signal(false);
  constructor() {
    void this.load();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (this.dirty()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    this.destroyRef.onDestroy(() => window.removeEventListener('beforeunload', beforeUnload));
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const r = await this.api.get<Roadmap>('/roadmaps/' + this.id);
      if (!r.access?.canEdit) {
        this.error.set('Você não possui permissão para editar esta trilha.');
        return;
      }
      this.roadmap.set(r);
      this.graph.set(r.graph);
      this.metadata.set({ title: r.title, description: r.description, category: r.category });
      this.baseline.set(JSON.stringify({ graph: r.graph, metadata: this.metadata() }));
      this.selected.set('');
      this.inspectorDirty.set(false);
      this.undoStack.set([]);
      this.redoStack.set([]);
      this.conflict.set(false);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  select(id: string) {
    if (this.inspectorDirty() && !confirm('Descartar os detalhes ainda não aplicados desta etapa?'))
      return;
    this.inspectorDirty.set(false);
    this.selected.set(id);
  }
  change(graph: Graph) {
    this.undoStack.update((s) => [...s.slice(-49), this.graph()]);
    this.redoStack.set([]);
    this.graph.set(graph);
  }
  addNode() {
    if (this.inspectorDirty() && !confirm('Descartar os detalhes ainda não aplicados?')) return;
    const id = crypto.randomUUID();
    this.change({
      ...this.graph(),
      nodes: [
        ...this.graph().nodes,
        {
          id,
          title: 'Nova etapa',
          type: 'module',
          description: '',
          required: true,
          position: {
            x: 100 + (this.graph().nodes.length % 3) * 240,
            y: 80 + Math.floor(this.graph().nodes.length / 3) * 160,
          },
          color: '#2563EB',
          resources: [],
        },
      ],
    });
    this.selected.set(id);
  }
  updateNode(node: StudyNode) {
    this.change({
      ...this.graph(),
      nodes: this.graph().nodes.map((n) => (n.id === node.id ? node : n)),
    });
    this.inspectorDirty.set(false);
  }
  duplicateNode() {
    if (this.inspectorDirty()) return;
    const n = this.selectedNode();
    if (!n) return;
    const copy = {
      ...structuredClone(n),
      id: crypto.randomUUID(),
      title: n.title.slice(0, 150) + ' (cópia)',
      position: { x: n.position.x + 40, y: n.position.y + 120 },
    };
    this.change({ ...this.graph(), nodes: [...this.graph().nodes, copy] });
    this.select(copy.id);
  }
  removeNode() {
    const id = this.selected();
    if (!confirm('Excluir esta etapa e suas conexões?')) return;
    this.change({
      nodes: this.graph().nodes.filter((n) => n.id !== id),
      edges: this.graph().edges.filter((e) => e.source !== id && e.target !== id),
    });
    this.selected.set('');
    this.inspectorDirty.set(false);
  }
  connect(event: Event) {
    event.preventDefault();
    const { source, target } = this.connectionModel();
    if (
      !source ||
      !target ||
      source === target ||
      this.graph().edges.some((e) => e.source === source && e.target === target)
    )
      return;
    this.change({
      ...this.graph(),
      edges: [...this.graph().edges, { id: crypto.randomUUID(), source, target, type: 'path' }],
    });
  }
  removeEdge(id: string) {
    this.change({ ...this.graph(), edges: this.graph().edges.filter((e) => e.id !== id) });
  }
  nodeTitle(id: string) {
    return this.graph().nodes.find((n) => n.id === id)?.title ?? '';
  }
  undo() {
    const stack = this.undoStack();
    if (!stack.length) return;
    this.redoStack.update((s) => [...s, this.graph()]);
    this.graph.set(stack[stack.length - 1]);
    this.undoStack.set(stack.slice(0, -1));
    this.inspectorDirty.set(false);
  }
  redo() {
    const stack = this.redoStack();
    if (!stack.length) return;
    this.undoStack.update((s) => [...s, this.graph()]);
    this.graph.set(stack[stack.length - 1]);
    this.redoStack.set(stack.slice(0, -1));
    this.inspectorDirty.set(false);
  }
  async save() {
    if (this.busy() || !this.metadataFields().valid() || this.inspectorDirty()) return;
    this.busy.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      let r = this.roadmap()!;
      const access = r.access;
      const graph = structuredClone(this.graph());
      const metadata = { ...this.metadata() };
      if (
        r.title !== metadata.title ||
        r.description !== metadata.description ||
        r.category !== metadata.category
      ) {
        r = await this.api.patch<Roadmap>('/roadmaps/' + r.id, {
          expectedRevision: r.revision,
          ...metadata,
        });
        this.roadmap.set({ ...r, access });
      }
      r = await this.api.put<Roadmap>('/roadmaps/' + r.id + '/graph', {
        expectedRevision: r.revision,
        graph,
      });
      this.roadmap.set({ ...r, access });
      this.baseline.set(JSON.stringify({ graph, metadata }));
      this.notices.show('Roadmap salvo. Mais um passo construído.');
    } catch (e) {
      this.error.set(errorMessage(e));
      this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
    } finally {
      this.busy.set(false);
    }
  }
  async publish() {
    const r = this.roadmap()!;
    if (this.dirty() || this.busy()) return;
    if (
      !confirm(
        r.visibility === 'private'
          ? 'Publicar esta trilha? Qualquer pessoa poderá consultar suas etapas e materiais.'
          : 'Tornar esta trilha privada? Pessoas sem acesso não poderão mais abri-la.',
      )
    )
      return;
    this.busy.set(true);
    try {
      const result = await this.api.put<Roadmap>('/roadmaps/' + r.id + '/visibility', {
        expectedRevision: r.revision,
        visibility: r.visibility === 'public' ? 'private' : 'public',
      });
      this.roadmap.set({ ...result, access: r.access });
      this.notices.show(
        result.visibility === 'public'
          ? 'Trilha publicada. Pronta para inspirar.'
          : 'Trilha agora está privada.',
      );
    } catch (e) {
      this.error.set(errorMessage(e));
      this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
    } finally {
      this.busy.set(false);
    }
  }
  reload() {
    if (confirm('Descartar as alterações locais e carregar a versão do servidor?'))
      void this.load();
  }
  exportDraft() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            title: this.metadata().title,
            description: this.metadata().description,
            category: this.metadata().category,
            graph: this.graph(),
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breadcrumbs-rascunho.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  async removeRoadmap() {
    if (
      !confirm(
        'Excluir definitivamente esta trilha, seus comentários e todo o progresso associado?',
      )
    )
      return;
    this.busy.set(true);
    try {
      await this.api.delete('/roadmaps/' + this.id);
      this.inspectorDirty.set(false);
      this.baseline.set(JSON.stringify({ graph: this.graph(), metadata: this.metadata() }));
      await this.router.navigate(['/meus-roadmaps']);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
