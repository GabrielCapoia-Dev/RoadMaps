import { TestBed } from '@angular/core/testing';
import { NodeInspector } from './node-inspector';
import { templateGraph, templates } from '../../../core/templates';
describe('Node inspector drafts', () => {
  it('reports unapplied resource fields as unsaved work', async () => {
    const fixture = TestBed.createComponent(NodeInspector);
    fixture.componentRef.setInput('node', templateGraph(templates[0]).nodes[0]);
    const changes: boolean[] = [];
    fixture.componentInstance.draftChanged.subscribe((value) => changes.push(value));
    await fixture.whenStable();
    fixture.componentInstance.resourceModel.set({
      label: 'Material ainda não adicionado',
      url: '',
    });
    await fixture.whenStable();
    expect(changes.at(-1)).toBe(true);
    fixture.componentInstance.resourceModel.set({ label: '', url: '' });
    await fixture.whenStable();
    expect(changes.at(-1)).toBe(false);
  });
  it('emits edited title immediately for autosave', async () => {
    const fixture = TestBed.createComponent(NodeInspector);
    const node = templateGraph(templates[0]).nodes[0];
    fixture.componentRef.setInput('node', node);
    await fixture.whenStable();
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    fixture.componentInstance.model.update((m) => ({ ...m, title: 'Uma nova ideia' }));
    await fixture.whenStable();
    fixture.componentInstance.emitDraft();
    await fixture.whenStable();
    expect(changed).toHaveBeenCalledWith({
      ...node,
      title: 'Uma nova ideia',
      shape: 'rounded',
      icon: 'layers',
      layout: 'horizontal',
      width: 192,
      height: 84,
      opacity: 1,
      zIndex: 0,
    });
  });
});
