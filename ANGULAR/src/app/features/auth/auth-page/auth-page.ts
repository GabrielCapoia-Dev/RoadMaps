import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  form,
  FormField,
  required,
  email,
  minLength,
  maxLength,
  submit,
  hidden,
  pattern,
} from '@angular/forms/signals';
import { Session } from '../../../core/session';
import { Api } from '../../../core/api';
import { errorMessage } from '../../../core/auth-interceptor';
import { safeNext } from '../../../core/auth-guard';
import { Icon } from '../../../shared/icon/icon';
@Component({
  selector: 'app-auth-page',
  imports: [RouterLink, FormField, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="auth-layout">
    <section class="auth-story">
      <span class="eyebrow">CURIOSIDADE É SÓ O COMEÇO</span>
      <h1>Uma ideia.<br />Novos caminhos.<br /><span>Seu próximo passo.</span></h1>
      <p>
        Crie, compartilhe e siga trilhas de conhecimento.<br />Aprenda no seu ritmo, junto de outras
        pessoas.
      </p>
      <div class="auth-path" aria-hidden="true">
        <span><app-icon name="sparkles" /></span><i></i><span><app-icon name="book" /></span><i></i
        ><span><app-icon name="flag" /></span>
      </div>
    </section>
    <section class="auth-card">
      <span class="tile blue"><app-icon [name]="mode() === 'verify' ? 'mail' : 'compass'" /></span>
      <h2>
        {{
          mode() === 'register'
            ? 'Seu caminho começa aqui'
            : mode() === 'verify'
              ? 'Confirme seu e-mail'
              : 'Bom ter você por aqui'
        }}
      </h2>
      <p class="muted">
        {{
          mode() === 'register'
            ? 'Crie sua conta e dê forma às suas ideias.'
            : mode() === 'verify'
              ? 'A confirmação será concluída automaticamente pelo link enviado para seu e-mail.'
              : 'Entre para continuar de onde parou.'
        }}
      </p>
      <form (submit)="send($event)" novalidate>
        @if (mode() === 'register') {
          <label
            >Seu nome<input
              autocomplete="name"
              [formField]="fields.name"
              placeholder="Como podemos chamar você?"
          /></label>
        }
        @if (mode() !== 'verify') {
          <label
            >E-mail<input
              type="email"
              autocomplete="email"
              [formField]="fields.email"
              placeholder="voce@exemplo.com" /></label
          ><label
            >Senha<input
              type="password"
              [attr.autocomplete]="mode() === 'register' ? 'new-password' : 'current-password'"
              [formField]="fields.password"
              placeholder="Sua senha"
          /></label>
          @if (mode() === 'register') {
            <small class="muted">Use entre 12 e 128 caracteres.</small>
          }
        } @else {
          <label
            >Link de confirmação
            <span class="muted">Abra o link recebido no e-mail para confirmar sua conta.</span>
          </label>
        }
        @for (error of fields().errorSummary(); track $index) {
          @if (attempted()) {
            <p class="field-error">{{ error.message }}</p>
          }
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (message()) {
          <p class="success" role="status">{{ message() }}</p>
        }
        <button type="submit" class="button primary full-width" [disabled]="busy()">
          {{
            busy()
              ? 'Aguarde…'
              : mode() === 'register'
                ? 'Criar minha conta'
                : mode() === 'verify'
                  ? 'Confirmar e-mail'
                  : 'Entrar'
          }}<app-icon name="arrow" />
        </button>
      </form>
      @if (mode() === 'login') {
        <p class="auth-alternative">
          Ainda não tem conta? <a routerLink="/cadastro">Começar agora</a>
        </p>
        <a class="text-link" routerLink="/confirmar-email">Já tenho um código de confirmação</a>
      }
      @if (mode() === 'register') {
        <p class="auth-alternative">
          Já faz parte? <a routerLink="/entrar">Entrar na minha conta</a>
        </p>
      }
      @if (mode() === 'verify') {
        <form (submit)="resend($event)" class="resend-form">
          <label
            >E-mail para reenviar o link<input
              type="email"
              autocomplete="email"
              [formField]="resendFields.email" /></label
          ><button class="button secondary full-width" [disabled]="busy()">Reenviar link</button>
        </form>
        <a routerLink="/entrar" class="text-link">Voltar para entrar</a>
      }
    </section>
  </div>`,
})
export class AuthPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private session = inject(Session);
  readonly mode = signal(this.route.snapshot.data['mode'] as 'login' | 'register' | 'verify');
  readonly model = signal({
    name: '',
    email: '',
    password: '',
    token: this.route.snapshot.queryParamMap.get('token') ?? '',
  });
  readonly fields = form(this.model, (s) => {
    hidden(s.name, () => this.mode() !== 'register');
    required(s.name, { message: 'Informe seu nome.' });
    minLength(s.name, 2, { message: 'Use pelo menos 2 caracteres no nome.' });
    maxLength(s.name, 80);
    pattern(s.name, /\S/);
    hidden(s.email, () => this.mode() === 'verify');
    required(s.email, { message: 'Informe seu e-mail.' });
    email(s.email, { message: 'Informe um e-mail válido.' });
    hidden(s.password, () => this.mode() === 'verify');
    required(s.password, { message: 'Informe sua senha.' });
    minLength(s.password, 12, { message: 'A senha deve ter pelo menos 12 caracteres.' });
    maxLength(s.password, 128);
    hidden(s.token, () => this.mode() !== 'verify');
    required(s.token, { message: 'Informe o código recebido por e-mail.' });
    pattern(s.token, /^[a-f0-9]{64}$/, { message: 'Abra o link recebido por e-mail.' });
  });
  readonly resendModel = signal({ email: '' });
  readonly resendFields = form(this.resendModel, (s) => {
    required(s.email);
    email(s.email);
  });
  readonly busy = signal(false);
  readonly attempted = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  ngOnInit() {
    if (this.mode() === 'verify' && this.model().token) void this.verifyFromLink();
  }
  private async verifyFromLink() {
    this.busy.set(true);
    this.error.set('');
    try {
      const auth = await this.api.post<{ accessToken: string; expiresAt: string }>(
        '/auth/verify-email',
        { token: this.model().token.trim() },
      );
      await this.session.start(auth.accessToken, auth.expiresAt);
      await this.router.navigateByUrl('/meus-roadmaps');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  send(event: Event) {
    event.preventDefault();
    this.attempted.set(true);
    if (this.busy()) return;
    void submit(this.fields, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        const m = this.model();
        if (this.mode() === 'login') {
          await this.session.login(m.email.trim(), m.password);
          await this.router.navigateByUrl(safeNext(this.route.snapshot.queryParamMap.get('next')));
        } else if (this.mode() === 'register') {
          await this.api.post('/auth/register', {
            name: m.name.trim(),
            email: m.email.trim(),
            password: m.password,
          });
          await this.router.navigate(['/confirmar-email']);
        } else {
          await this.verifyFromLink();
        }
      } catch (e) {
        this.error.set(
          e instanceof HttpErrorResponse && this.mode() === 'login'
            ? e.status === 401
              ? 'E-mail ou senha incorretos.'
              : e.status === 403
                ? 'Confirme seu e-mail antes de entrar. Use o link abaixo para informar seu código.'
                : errorMessage(e)
            : errorMessage(e),
        );
      } finally {
        this.busy.set(false);
      }
    });
  }
  resend(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    void submit(this.resendFields, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        await this.api.post('/auth/resend-verification', {
          email: this.resendModel().email.trim(),
        });
        this.message.set('Se houver uma conta pendente, um novo link será enviado.');
      } catch (e) {
        this.error.set(
          e instanceof HttpErrorResponse && this.mode() === 'login'
            ? e.status === 401
              ? 'E-mail ou senha incorretos.'
              : e.status === 403
                ? 'Confirme seu e-mail antes de entrar. Use o link abaixo para informar seu código.'
                : errorMessage(e)
            : errorMessage(e),
        );
      } finally {
        this.busy.set(false);
      }
    });
  }
}
