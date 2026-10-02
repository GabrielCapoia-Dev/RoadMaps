import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Session } from '../../core/session';
import { Icon } from '../icon/icon';
import { errorMessage } from '../../core/auth-interceptor';
@Component({
  selector: 'app-tour',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog #dialog (cancel)="closed.emit()">
    <div class="dialog-heading">
      <span class="eyebrow">BEM-VINDO À BREADCRUMBS</span
      ><button class="icon-button" aria-label="Fechar apresentação" (click)="closed.emit()">
        <app-icon name="x" />
      </button>
    </div>
    <div class="tour-icon"><app-icon [name]="steps[index()].icon" /></div>
    <span class="muted">Passo {{ index() + 1 }} de {{ steps.length }}</span>
    <h2>{{ steps[index()].title }}</h2>
    <p>{{ steps[index()].text }}</p>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <div class="dialog-actions">
      <button class="button subtle" (click)="closed.emit()">Pular por enquanto</button
      ><button class="button primary" [disabled]="busy()" (click)="next()">
        {{ index() === steps.length - 1 ? 'Vamos começar' : 'Próximo' }}<app-icon name="arrow" />
      </button>
    </div>
    <div class="tour-dots" aria-hidden="true">
      @for (step of steps; track step.title; let i = $index) {
        <span [class.current]="i === index()"></span>
      }
    </div>
  </dialog>`,
})
export class Tour {
  readonly closed = output<void>();
  readonly index = signal(0);
  readonly error = signal('');
  readonly busy = signal(false);
  private readonly session = inject(Session);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly steps = [
    {
      icon: 'compass',
      title: 'Todo aprendizado tem um começo',
      text: 'Explore trilhas públicas por assunto ou use um modelo de inspiração como ponto de partida.',
    },
    {
      icon: 'map',
      title: 'Dê forma ao seu conhecimento',
      text: 'Em Meus roadmaps, crie etapas, conecte ideias e adicione materiais no editor visual. Você escolhe o caminho.',
    },
    {
      icon: 'check',
      title: 'Veja cada passo fazer diferença',
      text: 'Ao estudar uma trilha, marque seu progresso. Seu acompanhamento é individual, mesmo em roadmaps compartilhados.',
    },
    {
      icon: 'users',
      title: 'Aprender fica melhor em comunidade',
      text: 'Publique suas trilhas, compartilhe com pessoas e troque ideias nos comentários. Roadmaps novos começam privados.',
    },
  ];
  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }
  async next() {
    if (this.index() < this.steps.length - 1) {
      this.index.update((i) => i + 1);
      return;
    }
    this.busy.set(true);
    try {
      if (this.session.user()) await this.session.completeTour();
      this.closed.emit();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
