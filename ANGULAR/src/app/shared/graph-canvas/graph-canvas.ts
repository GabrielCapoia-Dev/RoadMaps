import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
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
            [fReassignDisabled]="true"
          />
        }
        @for (node of graph().nodes; track node.id) {
          <div
            fNode
            fDragHandle
            [fNodeId]="node.id"
            [fNodePosition]="node.position"
            [fNodeDraggingDisabled]="!editable()"
            class="graph-node"
            [class.selected]="selected() === node.id"
            [style.--node-color]="node.color || '#2563EB'"
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
            <span class="node-type"
              ><app-icon
                [name]="
                  node.type === 'project'
                    ? 'flag'
                    : node.type === 'resource'
                      ? 'link'
                      : node.type === 'task'
                        ? 'check'
                        : 'layers'
                "
            /></span>
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
  readonly canvas = viewChild(FCanvasComponent);
  readonly zoom = viewChild(FZoomDirective);
  private fitted = false;
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
      edges: [...this.graph().edges, { id: crypto.randomUUID(), source, target, type: 'path' }],
    });
  }
}
