import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, form, required, maxLength, min, max, pattern, submit } from '@angular/forms/signals';
import type { StudyNode } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-node-inspector',
  imports: [FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inspector-title"><app-icon name="edit" /><div><h2>Etapa selecionada</h2><p class="hint">Edite visualmente e aplique ao mapa.</p></div></div>
    <form (submit)="apply($event)" novalidate>
      <label>Título<input [formField]="fields.title" /></label>
      <label>Tipo<select [formField]="fields.type">
        <option value="module">Módulo</option><option value="task">Tarefa</option><option value="resource">Recurso</option><option value="project">Projeto / marco</option>
        @if (!types.includes(model().type)) { <option [value]="model().type">{{ model().type }}</option> }
      </select></label>
      <label>Descrição<textarea rows="3" [formField]="fields.description"></textarea></label>
      <section class="inspector-section">
        <h3><app-icon name="edit" />Formato do card</h3>
        <div class="visual-preset-grid" aria-label="Formatos do card">
          @for (preset of shapePresets; track preset.value) {
            <button type="button" class="visual-preset" [class.active]="model().shape === preset.value" [attr.aria-label]="preset.label" (click)="choose('shape', preset.value)">
              <span class="preset-card" [attr.data-shape]="preset.value" [style.--preset-color]="preset.color"><app-icon [name]="model().icon" /><b>Aa</b></span><small>{{ preset.label }}</small>
            </button>
          }
        </div>
      </section>
      <section class="inspector-section">
        <h3><app-icon name="sparkles" />Cor</h3>
        <div class="color-preset-grid" aria-label="Cores predefinidas">
          @for (preset of colorPresets; track preset.value) {
            <button type="button" class="color-preset" [class.active]="model().color === preset.value" [style.background]="preset.value" [attr.aria-label]="preset.label" (click)="choose('color', preset.value)"></button>
          }
          <label class="custom-color" aria-label="Cor personalizada"><input type="color" [value]="model().color" (input)="choose('color', $any($event.target).value)" /></label>
        </div>
      </section>
      <section class="inspector-section">
        <h3><app-icon name="map" />Ícone e disposição</h3>
        <div class="icon-preset-grid" aria-label="Ícones da etapa">
          @for (icon of iconPresets; track icon) {
            <button type="button" class="icon-preset" [class.active]="model().icon === icon" [attr.aria-label]="'Ícone ' + icon" (click)="choose('icon', icon)"><app-icon [name]="icon" /></button>
          }
        </div>
        <div class="segmented-control" aria-label="Disposição do conteúdo">
          <button type="button" [class.active]="model().layout === 'horizontal'" (click)="choose('layout', 'horizontal')"><span class="layout-preview horizontal"><i></i><b></b></span>Lado a lado</button>
          <button type="button" [class.active]="model().layout === 'vertical'" (click)="choose('layout', 'vertical')"><span class="layout-preview vertical"><i></i><b></b></span>Cima e baixo</button>
        </div>
      </section>
      <section class="inspector-section">
        <h3><app-icon name="edit" />Tamanho e transparência</h3>
        <p class="hint">Arraste o canto inferior direito do card para redimensionar.</p>
        <label>Transparência <output>{{ math.round(model().opacity * 100) }}%</output><input type="range" min="20" max="100" [value]="model().opacity * 100" (input)="setOpacity($event)" /></label>
        <button type="button" class="button secondary full-width" (click)="autoSize()"><app-icon name="fit" />Ajustar card ao conteúdo</button>
      </section>
      <label class="checkbox-label"><input type="checkbox" [formField]="fields.required" />Etapa essencial</label>
      <button class="button primary full-width" [disabled]="!fields().valid()">Aplicar alterações</button>
    </form>
    <section class="inspector-section layer-actions">
      <h3><app-icon name="layers" />Camadas</h3>
      <div class="layer-buttons"><button type="button" class="button secondary" (click)="layerChange.emit('down')"><app-icon name="down" />Enviar para baixo</button><button type="button" class="button secondary" (click)="layerChange.emit('up')"><app-icon name="up" />Trazer para cima</button></div>
    </section>
    <details open>
      <summary>Materiais de estudo</summary>
      <ul class="compact-list">
        @for (item of node().resources; track $index) {
          <li><span>{{ item.label }}</span><button class="icon-button" [attr.aria-label]="'Remover ' + item.label" [disabled]="hasDraft()" (click)="removeResource($index)"><app-icon name="x" /></button></li>
        }
      </ul>
      <form (submit)="addResource($event)" novalidate>
        <label>Nome do material<input [formField]="resourceFields.label" placeholder="Artigo, vídeo, exercício…" /></label>
        <label>Endereço do material<input type="url" [formField]="resourceFields.url" placeholder="https://..." /></label>
        <button class="button secondary full-width" [disabled]="!resourceFields().valid() || node().resources.length >= 30 || hasDraft()"><app-icon name="link" />Adicionar material</button>
      </form>
      <p class="hint">Links HTTP ou HTTPS. Até 30 materiais.</p>
    </details>
    <div class="dialog-actions"><button class="button secondary" [disabled]="hasDraft() || !!resourceModel().label || !!resourceModel().url" (click)="duplicate.emit()"><app-icon name="plus" />Duplicar</button><button class="icon-button" aria-label="Excluir etapa" (click)="remove.emit()"><app-icon name="trash" /></button></div>
  `,
})
export class NodeInspector {
  readonly math = Math;
  readonly node = input.required<StudyNode>();
  readonly changed = output<StudyNode>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  readonly layerChange = output<'up' | 'down'>();
  readonly draftChanged = output<boolean>();
  readonly types = ['module', 'task', 'resource', 'project'];
  readonly shapePresets = [{ value: 'rounded', label: 'Arredondado', color: '#7c3aed' }, { value: 'square', label: 'Quadrado', color: '#2563eb' }, { value: 'pill', label: 'Pílula', color: '#a855f7' }, { value: 'outlined', label: 'Contorno', color: '#d946ef' }, { value: 'compact', label: 'Compacto', color: '#14b8a6' }];
  readonly colorPresets = [{ value: '#7c3aed', label: 'Violeta' }, { value: '#a855f7', label: 'Lilás' }, { value: '#d946ef', label: 'Roxo' }, { value: '#2563eb', label: 'Azul' }, { value: '#14b8a6', label: 'Turquesa' }, { value: '#f97316', label: 'Laranja' }];
  readonly iconPresets = ['layers', 'flag', 'link', 'check', 'map', 'sparkles', 'bookmark', 'compass', 'book', 'globe', 'users', 'camera'];
  readonly model = signal({ title: '', description: '', type: 'module', required: true, color: '#7c3aed', shape: 'rounded', icon: 'layers', layout: 'horizontal' as 'horizontal' | 'vertical', width: 192, height: 84, opacity: 1, zIndex: 0 });
  private baseline = signal('');
  readonly fields = form(this.model, (s) => { required(s.title); pattern(s.title, /\S/); maxLength(s.title, 160); maxLength(s.description, 10000); min(s.width, 120); max(s.width, 600); min(s.height, 64); max(s.height, 420); });
  readonly resourceModel = signal({ label: '', url: '' });
  readonly resourceFields = form(this.resourceModel, (s) => { required(s.label); maxLength(s.label, 200); required(s.url); maxLength(s.url, 2048); pattern(s.url, /^https?:\/\/[^\s.]+\.[^\s]+$/, { message: 'Use um link HTTP ou HTTPS válido.' }); });
  constructor() {
    effect(() => { const n = this.node(); const m = { title: n.title, description: n.description, type: n.type, required: n.required, color: n.color ?? '#7c3aed', shape: n.shape ?? 'rounded', icon: n.icon ?? 'layers', layout: n.layout ?? 'horizontal', width: n.width ?? 192, height: n.height ?? 84, opacity: n.opacity ?? 1, zIndex: n.zIndex ?? 0 }; this.baseline.set(JSON.stringify(m)); this.model.set(m); });
    effect(() => this.draftChanged.emit(this.hasDraft() || !!this.resourceModel().label || !!this.resourceModel().url));
  }
  hasDraft() { return JSON.stringify(this.model()) !== this.baseline(); }
  choose(field: 'shape' | 'color' | 'icon' | 'layout', value: string) { this.model.update((model) => ({ ...model, [field]: value })); }
  setOpacity(event: Event) { this.model.update((model) => ({ ...model, opacity: Number((event.target as HTMLInputElement).value) / 100 })); }
  autoSize() { const m = this.model(); const width = Math.min(600, Math.max(160, m.title.length * 8 + (m.layout === 'vertical' ? 42 : 118))); const height = m.layout === 'vertical' ? 132 : 84; this.model.update((model) => ({ ...model, width, height })); }
  apply(event: Event) { event.preventDefault(); void submit(this.fields, async () => { const m = this.model(); this.changed.emit({ ...this.node(), title: m.title.trim(), description: m.description, type: m.type, required: m.required, color: m.color, shape: m.shape, icon: m.icon, layout: m.layout, width: m.width, height: m.height, opacity: m.opacity, zIndex: m.zIndex }); }); }
  addResource(event: Event) { event.preventDefault(); void submit(this.resourceFields, async () => { this.changed.emit({ ...this.node(), resources: [...this.node().resources, this.resourceModel()] }); this.resourceModel.set({ label: '', url: '' }); }); }
  removeResource(index: number) { this.changed.emit({ ...this.node(), resources: this.node().resources.filter((_, i) => i !== index) }); }
}
