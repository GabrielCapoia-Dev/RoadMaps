import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import {
  FormField,
  form,
  required,
  maxLength,
  min,
  max,
  pattern,
  submit,
} from '@angular/forms/signals';
import type { StudyNode } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
@Component({
  selector: 'app-node-inspector',
  imports: [FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <h2>Detalhes da etapa</h2>
    <p class="hint">Edite e aplique as alterações ao mapa.</p>
    <form (submit)="apply($event)" novalidate>
      <label>Título<input [formField]="fields.title" /></label
      ><label
        >Tipo<select [formField]="fields.type">
          <option value="module">Módulo</option>
          <option value="task">Tarefa</option>
          <option value="resource">Recurso</option>
          <option value="project">Projeto / marco</option>
          @if (!types.includes(model().type)) {
            <option [value]="model().type">{{ model().type }}</option>
          }
        </select></label
      ><label>Descrição<textarea rows="4" [formField]="fields.description"></textarea></label
      ><label>Cor de destaque<input type="color" [formField]="fields.color" /></label
      ><label class="checkbox-label"
        ><input type="checkbox" [formField]="fields.required" />Etapa essencial</label
      >
      <div class="two-fields">
        <label>Posição X<input type="number" [formField]="fields.x" /></label
        ><label>Posição Y<input type="number" [formField]="fields.y" /></label>
      </div>
      <button class="button primary full-width" [disabled]="!fields().valid()">
        Aplicar à etapa
      </button>
    </form>
    <details open>
      <summary>Materiais de estudo</summary>
      <ul class="compact-list">
        @for (item of node().resources; track $index) {
          <li>
            <span>{{ item.label }}</span
            ><button
              class="icon-button"
              [attr.aria-label]="'Remover ' + item.label"
              [disabled]="hasDraft()"
              (click)="removeResource($index)"
            >
              <app-icon name="x" />
            </button>
          </li>
        }
      </ul>
      <form (submit)="addResource($event)" novalidate>
        <label
          >Nome do material<input
            [formField]="resourceFields.label"
            placeholder="Artigo, vídeo, exercício…" /></label
        ><label
          >Endereço do material<input
            type="url"
            [formField]="resourceFields.url"
            placeholder="https://..." /></label
        ><button
          class="button secondary full-width"
          [disabled]="!resourceFields().valid() || node().resources.length >= 30 || hasDraft()"
        >
          <app-icon name="link" />Adicionar material
        </button>
      </form>
      <p class="hint">Links HTTP ou HTTPS. Até 30 materiais.</p>
    </details>
    <div class="dialog-actions">
      <button
        class="button secondary"
        [disabled]="hasDraft() || !!resourceModel().label || !!resourceModel().url"
        (click)="duplicate.emit()"
      >
        <app-icon name="plus" />Duplicar</button
      ><button class="icon-button" aria-label="Excluir etapa" (click)="remove.emit()">
        <app-icon name="trash" />
      </button>
    </div>`,
})
export class NodeInspector {
  readonly node = input.required<StudyNode>();
  readonly changed = output<StudyNode>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  readonly draftChanged = output<boolean>();
  readonly types = ['module', 'task', 'resource', 'project'];
  readonly model = signal({
    title: '',
    description: '',
    type: 'module',
    required: true,
    color: '#7c3aed',
    x: 0,
    y: 0,
  });
  private baseline = signal('');
  readonly fields = form(this.model, (s) => {
    required(s.title);
    pattern(s.title, /\S/);
    maxLength(s.title, 160);
    maxLength(s.description, 10000);
    min(s.x, -100000);
    max(s.x, 100000);
    min(s.y, -100000);
    max(s.y, 100000);
  });
  readonly resourceModel = signal({ label: '', url: '' });
  readonly resourceFields = form(this.resourceModel, (s) => {
    required(s.label);
    maxLength(s.label, 200);
    required(s.url);
    maxLength(s.url, 2048);
    pattern(s.url, /^https?:\/\/[^\s.]+\.[^\s]+$/, {
      message: 'Use um link HTTP ou HTTPS válido.',
    });
  });
  constructor() {
    effect(() => {
      const n = this.node();
      const m = {
        title: n.title,
        description: n.description,
        type: n.type,
        required: n.required,
        color: n.color ?? '#7c3aed',
        x: n.position.x,
        y: n.position.y,
      };
      this.baseline.set(JSON.stringify(m));
      this.model.set(m);
    });
    effect(() =>
      this.draftChanged.emit(
        this.hasDraft() || !!this.resourceModel().label || !!this.resourceModel().url,
      ),
    );
  }
  hasDraft() {
    return JSON.stringify(this.model()) !== this.baseline();
  }
  apply(event: Event) {
    event.preventDefault();
    void submit(this.fields, async () => {
      const m = this.model();
      this.changed.emit({
        ...this.node(),
        title: m.title.trim(),
        description: m.description,
        type: m.type,
        required: m.required,
        color: m.color,
        position: { x: m.x, y: m.y },
      });
    });
  }
  addResource(event: Event) {
    event.preventDefault();
    void submit(this.resourceFields, async () => {
      this.changed.emit({
        ...this.node(),
        resources: [...this.node().resources, this.resourceModel()],
      });
      this.resourceModel.set({ label: '', url: '' });
    });
  }
  removeResource(index: number) {
    this.changed.emit({
      ...this.node(),
      resources: this.node().resources.filter((_, i) => i !== index),
    });
  }
}
