import { ChangeDetectionStrategy, Component, input, output, signal, viewChild } from '@angular/core';
import {
  FFlowModule,
  FCanvasComponent,
  FZoomDirective,
  FCreateConnectionEvent,
  FMoveNodesEvent,
} from '@foblex/flow';
import type { Graph } from '../../core/models';
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
            [attr.data-edge-type]="connectionType(edge)"
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
            [style.width.px]="sizeFor(node).width"
            [style.min-height.px]="sizeFor(node).height"
            [style.height.px]="sizeFor(node).height"
            [style.opacity]="node.opacity || 1"
            [style.z-index]="node.zIndex || 0"
            class="graph-node"
            [class.selected]="selected() === node.id"
            [style.--node-color]="node.color || '#7c3aed'"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Etapa: ' + node.title"
            [attr.aria-pressed]="selected() === node.id"
            (click)="selectedChange.emit(node.id)"
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
            <span class="node-type"><app-icon [name]="nodeIcon(node)" /></span>
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
        <f-connection-for-create /> </f-canvas
    ></f-flow>
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
  readonly graphChange = output<Graph>();
  readonly selectedChange = output<string>();
  readonly edgeRemoved = output<string>();
  readonly selectedEdgeChange = output<string>();
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
  sizeFor(node: Graph['nodes'][number]) {
    return this.resizeDraft()[node.id] ?? {
      width: node.width || 192,
      height: node.height || 84,
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
}
