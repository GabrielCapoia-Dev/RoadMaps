import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Api } from '../../../core/api';
import { errorMessage } from '../../../core/auth-interceptor';
import type { Member, Page, Profile } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
@Component({
  selector: 'app-share-dialog',
  imports: [FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <dialog #dialog class="wide-dialog" (cancel)="closed.emit()">
    <div class="dialog-heading">
      <h2>Compartilhar conhecimento</h2>
      <button class="icon-button" aria-label="Fechar compartilhamento" (click)="closed.emit()">
        <app-icon name="x" />
      </button>
    </div>
    <p class="muted">Adicione pessoas à trilha e escolha o que cada uma pode fazer.</p>
    @if (members.isLoading()) {
      <p role="status">Carregando acessos…</p>
    } @else if (members.error()) {
      <p class="error">{{ errorMessage(members.error()) }}</p>
      <button class="button secondary" (click)="members.reload()">Tentar novamente</button>
    } @else {
      @for (member of members.value(); track member.userId) {
        <div class="member-row">
          <span>{{ member.name }}</span
          ><span class="soft-badge">{{ roles[member.role] }}</span>
          @if (member.role !== 'owner') {
            <button
              class="icon-button"
              [disabled]="busy()"
              [attr.aria-label]="'Remover acesso de ' + member.name"
              (click)="remove(member.userId)"
            >
              <app-icon name="x" />
            </button>
          }
        </div>
      }
    }
    <form (submit)="search($event)" style="margin-top:23px">
      <label
        >Encontrar uma pessoa<input [formField]="fields.q" placeholder="Busque pelo nome" /></label
      ><label
        >Permissão<select [formField]="fields.role">
          <option value="viewer">Visualizar e estudar</option>
          <option value="commenter">Visualizar e comentar</option>
          <option value="editor">Editar a trilha</option>
        </select></label
      ><button class="button secondary" [disabled]="busy() || model().q.trim().length < 2">
        Buscar pessoas
      </button>
    </form>
    <div class="member-search-results">
      @for (person of results(); track person.id) {
        <button [disabled]="busy() || person.id === ownerId()" (click)="add(person.id)">
          <span>{{ person.name }}</span
          ><span>Conceder acesso +</span>
        </button>
      }
    </div>
    @if (searched() && !results().length) {
      <p class="hint">Nenhuma pessoa encontrada. A conta precisa ter e-mail confirmado.</p>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success" role="status">{{ message() }}</p>
    }
    <p class="hint">
      Edição permite alterar etapas e materiais. Publicação e gestão de acessos continuam com o
      proprietário.
    </p>
  </dialog>`,
})
export class ShareDialog {
  readonly roadmapId = input.required<string>();
  readonly ownerId = input.required<string>();
  readonly closed = output<void>();
  private api = inject(Api);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly members = resource({
    params: () => this.roadmapId(),
    loader: ({ params }) => this.api.get<Member[]>('/roadmaps/' + params + '/members'),
  });
  readonly model = signal({ q: '', role: 'viewer' });
  readonly fields = form(this.model);
  readonly results = signal<Profile[]>([]);
  readonly searched = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly errorMessage = errorMessage;
  readonly roles: Record<string, string> = {
    owner: 'Proprietário',
    editor: 'Editor',
    commenter: 'Comentarista',
    viewer: 'Leitor',
  };
  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }
  async search(event: Event) {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    try {
      this.results.set(
        (await this.api.get<Page<Profile>>('/users', { q: this.model().q, limit: 10 })).items,
      );
      this.searched.set(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async add(userId: string) {
    this.busy.set(true);
    this.error.set('');
    try {
      this.members.set(
        await this.api.put<Member[]>('/roadmaps/' + this.roadmapId() + '/members', {
          userId,
          role: this.model().role,
        }),
      );
      this.message.set('Acesso atualizado.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async remove(userId: string) {
    if (!confirm('Remover o acesso desta pessoa?')) return;
    this.busy.set(true);
    try {
      await this.api.delete('/roadmaps/' + this.roadmapId() + '/members/' + userId);
      this.members.reload();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
