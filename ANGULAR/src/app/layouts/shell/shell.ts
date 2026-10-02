import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormField, form } from '@angular/forms/signals';
import { Session } from '../../core/session';
import { Notifications } from '../../core/notifications';
import { Brand } from '../../shared/brand/brand';
import { Icon } from '../../shared/icon/icon';
import { Tour } from '../../shared/tour/tour';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormField, Brand, Icon, Tour],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content" (click)="skip($event)">Pular para o conteúdo</a>
    <div class="app-shell" [class.editor-mode]="editorMode()">
      <aside class="sidebar" [class.mobile-open]="menu()">
        <a routerLink="/" class="brand-link" aria-label="BreadCrumbs — início"><app-brand /></a>
        <button class="icon-button mobile-close" aria-label="Fechar menu" (click)="menu.set(false)">
          <app-icon name="x" />
        </button>
        <div class="nav-caption">SEU UNIVERSO DE CONHECIMENTO</div>
        <nav aria-label="Principal">
          <a routerLink="/explorar" routerLinkActive="active" (click)="menu.set(false)"
            ><app-icon name="compass" />Explorar</a
          >
          <a
            routerLink="/meus-roadmaps"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="menu.set(false)"
            ><app-icon name="map" />Meus roadmaps</a
          >
          <a routerLink="/salvos" routerLinkActive="active" (click)="menu.set(false)"
            ><app-icon name="bookmark" />Salvos</a
          >
          <a routerLink="/comunidade" routerLinkActive="active" (click)="menu.set(false)"
            ><app-icon name="users" />Comunidade</a
          >
        </nav>
        <button class="button primary create-nav" (click)="create()">
          <app-icon name="plus" />Criar roadmap
        </button>
        <div class="sidebar-bottom">
          <div class="sidebar-note">
            <span class="mini-spark"><app-icon name="sparkles" /></span
            ><strong>Um passo de cada vez.</strong>
            <p>Grandes descobertas começam com curiosidade.</p>
            <a routerLink="/explorar">Encontre seu caminho <app-icon name="arrow" /></a>
          </div>
          <button class="nav-help" (click)="tour.set(true); menu.set(false)">
            <app-icon name="help" />Conheça a plataforma
          </button>
          <div class="sidebar-foot">Feito para mentes curiosas <span>✦</span></div>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <button
            class="icon-button mobile-toggle"
            aria-label="Abrir menu"
            [attr.aria-expanded]="menu()"
            (click)="menu.set(!menu())"
          >
            <app-icon name="menu" />
          </button>
          <form class="global-search" (submit)="search($event)">
            <app-icon name="search" /><input
              [formField]="searchForm.q"
              aria-label="Buscar roadmaps ou temas"
              placeholder="O que você quer aprender hoje?"
            /><button class="search-submit" type="submit" aria-label="Buscar">
              <app-icon name="arrow" />
            </button>
          </form>
          <div class="account-actions">
            @if (session.user(); as user) {
              <a class="account" routerLink="/perfil"
                ><span class="avatar">{{ user.name.slice(0, 1) }}</span
                ><span>{{ user.name.split(' ')[0] }}</span></a
              ><button class="icon-button" (click)="logout()" aria-label="Sair">
                <app-icon name="logout" />
              </button>
            } @else {
              <a class="login-link" routerLink="/entrar">Entrar</a
              ><a class="button primary small-button" routerLink="/cadastro"
                >Começar agora <app-icon name="arrow"
              /></a>
            }
          </div>
        </header>
        <main id="main-content" tabindex="-1"><router-outlet /></main>
        <footer class="page-footer">
          <span>© {{ year }} BreadCrumbs</span
          ><span>Conhecimento ganha vida quando é compartilhado.</span>
        </footer>
      </div>
    </div>
    @if (notices.message()) {
      <div class="toast" role="status">
        <app-icon name="check" />{{ notices.message()
        }}<button class="icon-button" aria-label="Fechar aviso" (click)="notices.message.set('')">
          <app-icon name="x" />
        </button>
      </div>
    }
    @if (tour()) {
      <app-tour (closed)="tour.set(false)" />
    }
  `,
})
export class Shell {
  readonly session = inject(Session);
  readonly notices = inject(Notifications);
  private router = inject(Router);
  readonly menu = signal(false);
  readonly editorMode = signal(false);
  readonly tour = signal(false);
  readonly year = new Date().getFullYear();
  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);
  constructor() {
    void this.session.restore();
    this.editorMode.set(this.router.url.startsWith('/editor/'));
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.editorMode.set(event.urlAfterRedirects.startsWith('/editor/'));
      }
    });
  }
  create() {
    this.menu.set(false);
    void this.router.navigate(['/meus-roadmaps'], { queryParams: { criar: Date.now() } });
  }
  skip(event: Event) {
    event.preventDefault();
    const main = document.getElementById('main-content');
    main?.focus();
    main?.scrollIntoView();
  }
  search(event: Event) {
    event.preventDefault();
    void this.router.navigate(['/explorar'], { queryParams: { q: this.searchModel().q || null } });
  }
  async logout() {
    try {
      await this.session.logout();
    } catch {
      this.notices.show('Sessão encerrada neste navegador.');
    }
    void this.router.navigate(['/explorar']);
  }
}
