import { ChangeDetectionStrategy, Component, input, output, signal, viewChild } from '@angular/core';
import {
  FFlowModule,
  FCanvasComponent,
  FZoomDirective,
  FCreateConnectionEvent,
  FMoveNodesEvent,
} from '@foblex/flow';
import type { DrawItem, Graph } from '../../core/models';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-graph-canvas',
  imports: [FFlowModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="graph-surface" aria-label="Mapa visual da trilha">
    <f-flow
      fDraggable
      (fMoveNodes)="move($event)"
      (fCreateConnection)="connect($event)"
      (fNodesRendered)="initialFit()"
    >
      <f-canvas fZoom [fZoomMinimum]="0.2" [fZoomMaximum]="2">
        @for (edge of graph().edges; track edge.id) {
          <f-connection
            [fConnectionId]="edge.id"
            [fSourceId]="edge.source + '-out'"
            [fTargetId]="edge.target + '-in'"
            [fType]="connectionType(edge)"
            [fReassignDisabled]="true"
            [attr.data-edge-type]="edgeType(edge)"
            [style.--edge-color]="edge.color || '#7c91b8'"
            [style.--edge-width]="(edge.strokeWidth || 2) + 'px'"
            [style.--edge-opacity]="edge.opacity || 1"
            (click)="selectedEdgeChange.emit(edge.id)"
            (contextmenu)="removeConnection($event, edge.id)"
          />
        }
        @for (node of graph().nodes; track node.id) {
          <div
            fNode
            fDragHandle
            [fNodeId]="node.id"
            [fNodePosition]="node.position"
            [fNodeDraggingDisabled]="!editable()"
            [attr.data-shape]="node.shape || 'rounded'"
            [attr.data-layout]="node.layout || 'horizontal'"
            [style.--node-width]="sizeFor(node).width + 'px'"
            [style.--node-height]="sizeFor(node).height + 'px'"
            [style.opacity]="node.opacity || 1"
            [style.z-index]="node.zIndex || 0"
            [style.--node-background]="node.backgroundColor || '#ffffff'"
            [style.--node-title-weight]="node.fontWeight || 'bold'"
            [style.--node-title-style]="node.fontStyle || 'normal'"
            [style.--node-title-decoration]="node.textDecoration || 'none'"
            [style.--node-title-size]="fontSize(node.fontSize)"
            class="graph-node"
            [class.selected]="selected() === node.id || selectedIds().includes(node.id)"
            [style.--node-color]="node.color || '#7c3aed'"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Etapa: ' + node.title"
            [attr.aria-pressed]="selected() === node.id || selectedIds().includes(node.id)"
            (click)="selectNode($event, node.id)"
            (contextmenu)="openContextMenu($event)"
            (keydown.enter)="selectedChange.emit(node.id)"
            (keydown.space)="$event.preventDefault(); selectedChange.emit(node.id)"
          >
            <div
              class="connector in"
              fConnector
              fConnectorType="target"
              [fConnectorId]="node.id + '-in'"
              fConnectorConnectableSide="top"
              [fConnectorMultiple]="true"
              [fConnectorDisabled]="!editable()"
            ></div>
            @if (nodeIcon(node)) { <span class="node-type"><app-icon [name]="nodeIcon(node)" /></span> }
            <div>
              <strong>{{ node.title }}</strong
              ><small
                >{{ node.required ? 'Etapa essencial' : 'Etapa opcional' }} ·
                {{ node.resources.length }} materiais</small
              >
            </div>
            <div
              class="connector out"
              fConnector
              fConnectorType="source"
              [fConnectorId]="node.id + '-out'"
              fConnectorConnectableSide="bottom"
              [fConnectorMultiple]="true"
              [fConnectorDisabled]="!editable()"
            ></div>
            @if (editable()) {
              <button
                class="node-resize-handle"
                type="button"
                aria-label="Redimensionar etapa"
                (pointerdown)="startResize($event, node)"
              ></button>
            }
          </div>
        }
        <f-connection-for-create />
        </f-canvas
    ></f-flow>
    <svg #drawSurface class="draw-layer" [class.active]="!!drawTool()" viewBox="0 0 1800 1100" preserveAspectRatio="none" (pointerdown)="beginDraw($event)" (pointermove)="moveDraw($event)" (pointerup)="endDraw($event)" (pointercancel)="cancelDraw($event)">
          @for (item of graph().drawings || []; track item.id) {
            @if (item.kind === 'freehand') { <polyline [attr.points]="pointsAttribute(item.points || [item.from, item.to])" fill="none" [attr.stroke]="item.color" [attr.stroke-width]="item.strokeWidth" [attr.opacity]="item.opacity" stroke-linecap="round" stroke-linejoin="round" /> }
            @if (item.kind === 'line' || item.kind === 'arrow') { <line [attr.x1]="item.from.x" [attr.y1]="item.from.y" [attr.x2]="item.to.x" [attr.y2]="item.to.y" [attr.stroke]="item.color" [attr.stroke-width]="item.strokeWidth" [attr.opacity]="item.opacity" [attr.marker-end]="item.kind === 'arrow' ? 'url(#draw-arrow)' : null" /> }
            @if (item.kind === 'rectangle') { <rect [attr.x]="Math.min(item.from.x, item.to.x)" [attr.y]="Math.min(item.from.y, item.to.y)" [attr.width]="Math.abs(item.to.x - item.from.x)" [attr.height]="Math.abs(item.to.y - item.from.y)" fill="none" [attr.stroke]="item.color" [attr.stroke-width]="item.strokeWidth" [attr.opacity]="item.opacity" /> }
            @if (item.kind === 'circle') { <ellipse [attr.cx]="(item.from.x + item.to.x) / 2" [attr.cy]="(item.from.y + item.to.y) / 2" [attr.rx]="Math.abs(item.to.x - item.from.x) / 2" [attr.ry]="Math.abs(item.to.y - item.from.y) / 2" fill="none" [attr.stroke]="item.color" [attr.stroke-width]="item.strokeWidth" [attr.opacity]="item.opacity" /> }
            @if (item.kind === 'text') { <text [attr.x]="item.position.x" [attr.y]="item.position.y" [attr.fill]="item.color" [attr.font-size]="item.fontSize" [attr.opacity]="item.opacity">{{ item.text }}</text> }
            @if (item.kind === 'icon') { <text [attr.x]="item.position.x" [attr.y]="item.position.y" [attr.fill]="item.color" font-size="28" [attr.opacity]="item.opacity">✦</text> }
          }
          @if (drawPreview(); as preview) {
            @if (drawTool() === 'freehand') { <polyline [attr.points]="pointsAttribute(preview.points)" fill="none" stroke="#7c3aed" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round" /> }
            @else { <line [attr.x1]="preview.from.x" [attr.y1]="preview.from.y" [attr.x2]="preview.to.x" [attr.y2]="preview.to.y" stroke="#7c3aed" stroke-width="2" stroke-dasharray="6 4" /> }
          }
          <defs><marker id="draw-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="context-stroke" /></marker></defs>
    </svg>
    @if (textEditor(); as editor) {
      <form class="draw-text-editor" [style.left.px]="editor.left" [style.top.px]="editor.top" (submit)="commitTextDraw($event)" (pointerdown)="$event.stopPropagation()">
        <input autofocus [value]="editor.text" aria-label="Texto da anotação" placeholder="Digite o texto" (input)="updateTextDraft($event)" (keydown.escape)="textEditor.set(null)" />
        <button type="submit" class="button primary">Inserir</button>
      </form>
    }
    <div class="graph-controls" aria-label="Controles do mapa">
      <button class="icon-button" (click)="zoom()?.zoomOut()" aria-label="Diminuir zoom">
        <app-icon name="minus" /></button
      ><button class="icon-button" (click)="fit()" aria-label="Ajustar mapa à tela">
        <app-icon name="fit" /></button
      ><button class="icon-button" (click)="zoom()?.zoomIn()" aria-label="Aumentar zoom">
        <app-icon name="plus" />
      </button>
    </div>
    <span class="graph-caption"
      >{{
        editable() ? 'Arraste as etapas • Conecte pelos pontos' : 'Arraste o fundo para navegar'
      }}
      · Role para ampliar</span
    >
  </div>`,
})
export class GraphCanvas {
  readonly graph = input.required<Graph>();
  readonly editable = input(false);
  readonly selected = input('');
  readonly selectedIds = input<string[]>([]);
  readonly drawTool = input<'' | 'freehand' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'text' | 'icon'>('');
  readonly graphChange = output<Graph>();
  readonly selectedChange = output<string>();
  readonly edgeRemoved = output<string>();
  readonly selectedEdgeChange = output<string>();
  readonly selectionChange = output<string[]>();
  readonly contextMenu = output<{ x: number; y: number }>();
  readonly drawingState = signal<{ from: { x: number; y: number }; to: { x: number; y: number }; points: { x: number; y: number }[] } | null>(null);
  readonly drawPreview = this.drawingState.asReadonly();
  readonly textEditor = signal<{ point: { x: number; y: number }; left: number; top: number; text: string } | null>(null);
  readonly Math = Math;
  readonly canvas = viewChild(FCanvasComponent);
  readonly zoom = viewChild(FZoomDirective);
  private fitted = false;
  private resizeState:
    | { id: string; startX: number; startY: number; width: number; height: number }
    | undefined;
  readonly resizeDraft = signal<Record<string, { width: number; height: number }>>({});
  initialFit() {
    if (!this.fitted && this.graph().nodes.length) {
      this.fit();
      this.fitted = true;
    }
  }
  fit() {
    if (this.graph().nodes.length) this.canvas()?.fitToScreen({ x: 50, y: 65 }, false, false, 1);
  }
  move(event: FMoveNodesEvent) {
    if (!this.editable()) return;
    this.graphChange.emit({
      ...this.graph(),
      nodes: this.graph().nodes.map((n) => ({
        ...n,
        position: event.nodes.find((m) => m.id === n.id)?.position ?? n.position,
        layout: n.layout ?? 'horizontal',
      })),
    });
  }
  connect(event: FCreateConnectionEvent) {
    if (!this.editable() || !event.targetId) return;
    const source = event.sourceId.replace(/-out$/, '');
    const target = event.targetId.replace(/-in$/, '');
    if (
      source === target ||
      this.graph().edges.some((e) => e.source === source && e.target === target)
    )
      return;
    this.graphChange.emit({
      ...this.graph(),
      edges: [...this.graph().edges, { id: crypto.randomUUID(), source, target, type: 'straight' }],
    });
  }
  nodeIcon(node: Graph['nodes'][number]) {
    return (
      node.icon ||
      (node.type === 'project'
        ? 'flag'
        : node.type === 'resource'
          ? 'link'
          : node.type === 'task'
            ? 'check'
            : 'layers')
    );
  }
  fontSize(size: Graph['nodes'][number]['fontSize']) { return ({ h1: '24px', h2: '20px', h3: '17px', h4: '13px', h5: '11px', h6: '10px' }[size || 'h4']); }
  selectNode(event: MouseEvent, id: string) {
    event.stopPropagation();
    if (event.shiftKey) {
      this.selectionChange.emit(this.selectedIds().includes(id) ? this.selectedIds().filter((item) => item !== id) : [...this.selectedIds(), id]);
      return;
    }
    this.selectionChange.emit([id]);
    this.selectedChange.emit(id);
  }
  openContextMenu(event: MouseEvent) {
    if (!this.editable()) return;
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.emit({ x: event.clientX, y: event.clientY });
  }
  sizeFor(node: Graph['nodes'][number]) {
    return this.resizeDraft()[node.id] ?? {
      width: Math.max(220, node.width || 220),
      height: Math.max(96, node.height || 96),
    };
  }
  startResize(event: PointerEvent, node: Graph['nodes'][number]) {
    if (!this.editable()) return;
    event.preventDefault();
    event.stopPropagation();
    const size = this.sizeFor(node);
    this.resizeState = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      width: size.width,
      height: size.height,
    };
    document.addEventListener('pointermove', this.resizeMove);
    document.addEventListener('pointerup', this.resizeEnd, { once: true });
  }
  private resizeMove = (event: PointerEvent) => {
    const state = this.resizeState;
    if (!state) return;
    this.resizeDraft.update((draft) => ({
      ...draft,
      [state.id]: {
        width: Math.min(600, Math.max(120, state.width + event.clientX - state.startX)),
        height: Math.min(420, Math.max(64, state.height + event.clientY - state.startY)),
      },
    }));
  };
  private resizeEnd = () => {
    const state = this.resizeState;
    if (!state) return;
    const size = this.resizeDraft()[state.id];
    this.resizeState = undefined;
    document.removeEventListener('pointermove', this.resizeMove);
    if (size) {
      this.graphChange.emit({
        ...this.graph(),
        nodes: this.graph().nodes.map((node) =>
          node.id === state.id ? { ...node, width: size.width, height: size.height } : node,
        ),
      });
      this.resizeDraft.update((draft) => {
        const next = { ...draft };
        delete next[state.id];
        return next;
      });
    }
  };
  connectionType(edge: Graph['edges'][number]) {
    // Foblex has no stable adaptive router. Render it through the supported
    // segment connector while keeping the persisted type for the inspector.
    return edge.type === 'adaptive' ? 'segment' : this.edgeType(edge);
  }
  edgeType(edge: Graph['edges'][number]) {
    return ['straight', 'segment', 'bezier', 'adaptive'].includes(edge.type)
      ? edge.type
      : 'straight';
  }
  removeConnection(event: MouseEvent, id: string) {
    if (!this.editable()) return;
    event.preventDefault();
    event.stopPropagation();
    this.edgeRemoved.emit(id);
  }
  private drawPoint(event: PointerEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (matrix) {
      const mapped = point.matrixTransform(matrix.inverse());
      return { x: Math.max(0, Math.min(1800, mapped.x)), y: Math.max(0, Math.min(1100, mapped.y)) };
    }
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 1800, y: ((event.clientY - rect.top) / rect.height) * 1100 };
  }
  pointsAttribute(points: { x: number; y: number }[]) { return points.map((point) => `${point.x},${point.y}`).join(' '); }
  beginDraw(event: PointerEvent) {
    if (!this.drawTool()) return;
    event.preventDefault();
    event.stopPropagation();
    const point = this.drawPoint(event);
    if (this.drawTool() === 'text') {
      const surface = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
      this.textEditor.set({ point, left: event.clientX - surface.left, top: event.clientY - surface.top, text: '' });
      return;
    }
    if (this.drawTool() === 'icon') { this.finishPointDraw(point, point); return; }
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    this.drawingState.set({ from: point, to: point, points: [point] });
  }
  moveDraw(event: PointerEvent) {
    const state = this.drawingState();
    if (!state) return;
    event.preventDefault();
    const point = this.drawPoint(event);
    this.drawingState.set({ ...state, to: point, points: [...state.points, point] });
  }
  endDraw(event: PointerEvent) {
    const state = this.drawingState();
    if (!state) return;
    event.preventDefault();
    this.finishPointDraw(state.from, this.drawPoint(event), state.points);
    (event.currentTarget as SVGSVGElement).releasePointerCapture?.(event.pointerId);
  }
  cancelDraw(event: PointerEvent) { this.drawingState.set(null); (event.currentTarget as SVGSVGElement).releasePointerCapture?.(event.pointerId); }
  updateTextDraft(event: Event) { this.textEditor.update((draft) => draft ? { ...draft, text: (event.target as HTMLInputElement).value } : draft); }
  commitTextDraw(event: SubmitEvent) {
    event.preventDefault();
    const draft = this.textEditor();
    if (!draft?.text.trim()) return;
    this.graphChange.emit({ ...this.graph(), drawings: [...(this.graph().drawings || []), { id: crypto.randomUUID(), kind: 'text', color: '#7c3aed', opacity: 1, position: draft.point, text: draft.text.trim(), fontSize: 16 }] });
    this.textEditor.set(null);
  }
  private finishPointDraw(from: { x: number; y: number }, to: { x: number; y: number }, points = [from, to]) {
    const tool = this.drawTool();
    if (!tool || tool === 'text') return;
    const base = { id: crypto.randomUUID(), color: '#7c3aed', opacity: 1 };
    let item: DrawItem;
    if (tool === 'icon') item = { ...base, kind: 'icon', position: to, icon: 'sparkles' };
    else item = { ...base, kind: tool, from, to, points, strokeWidth: 2 } as DrawItem;
    this.graphChange.emit({ ...this.graph(), drawings: [...(this.graph().drawings || []), item] });
    this.drawingState.set(null);
  }
}
