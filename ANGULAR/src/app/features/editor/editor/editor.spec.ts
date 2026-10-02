import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from '../../../core/api';
import { Editor } from './editor';
import { templateGraph, templateRoadmap, templates } from '../../../core/templates';
import type { Roadmap } from '../../../core/models';
describe('Editor persistence and history', () => {
  const original = {
    ...templateRoadmap(templates[0]),
    id: 'roadmap',
    ownerId: 'owner',
    title: 'Aprender',
    description: '',
    category: 'Geral',
    tags: [],
    revision: 3,
    visibility: 'private',
    graph: templateGraph(templates[0]),
    access: { role: 'owner', canEdit: true, canManage: true, canComment: true },
  } as Roadmap;
  let editor: Editor;
  let api: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {
    api = {
      get: vi.fn().mockResolvedValue(structuredClone(original)),
      put: vi.fn(),
      patch: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Api, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'roadmap']]) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    editor = TestBed.runInInjectionContext(() => new Editor());
    await Promise.resolve();
  });
  it('preserves graph identities across undo and redo', () => {
    expect(editor.dirty()).toBe(false);
    editor.addNode();
    const added = editor.graph().nodes.at(-1)!.id;
    expect(editor.dirty()).toBe(true);
    editor.undo();
    expect(editor.graph()).toEqual(original.graph);
    editor.redo();
    expect(editor.graph().nodes.at(-1)!.id).toBe(added);
  });
  it('removes attached edges with a node and can undo the deletion', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const node = original.graph.nodes[0];
    editor.selected.set(node.id);
    editor.removeNode();
    expect(editor.graph().edges.some((e) => e.source === node.id || e.target === node.id)).toBe(
      false,
    );
    editor.undo();
    expect(editor.graph()).toEqual(original.graph);
    vi.restoreAllMocks();
  });
  it('retains local work on a revision conflict and sends the expected revision', async () => {
    editor.addNode();
    const local = structuredClone(editor.graph());
    api.put.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    await editor.save();
    expect(api.put).toHaveBeenCalledWith('/roadmaps/roadmap/graph', {
      expectedRevision: 3,
      graph: local,
    });
    expect(editor.graph()).toEqual(local);
    expect(editor.dirty()).toBe(true);
    expect(editor.conflict()).toBe(true);
  });
  it('marks the exact successful snapshot as saved and retains access capabilities', async () => {
    editor.addNode();
    api.put.mockResolvedValue({
      ...original,
      revision: 4,
      graph: editor.graph(),
      access: undefined,
    });
    await editor.save();
    expect(editor.dirty()).toBe(false);
    expect(editor.roadmap()?.revision).toBe(4);
    expect(editor.roadmap()?.access?.canManage).toBe(true);
  });
  it('uses the new revision after metadata changes and keeps the graph dirty if the second write fails', async () => {
    editor.metadata.update((m) => ({ ...m, title: 'Novo título' }));
    editor.addNode();
    api.patch.mockResolvedValue({ ...original, title: 'Novo título', revision: 4 });
    api.put.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    await editor.save();
    expect(api.put.mock.calls[0][1].expectedRevision).toBe(4);
    expect(editor.roadmap()?.revision).toBe(4);
    expect(editor.dirty()).toBe(true);
  });
  it('does not persist while node details are unapplied', async () => {
    editor.inspectorDirty.set(true);
    await editor.save();
    expect(api.put).not.toHaveBeenCalled();
  });
  it('does not block navigation when the roadmap could not load', () => {
    editor.roadmap.set(undefined);
    expect(editor.dirty()).toBe(false);
  });
});
