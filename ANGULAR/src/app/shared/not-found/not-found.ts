import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found',
  styles: ``,
  template: `<div class="page empty-state">
    <span class="eyebrow" style="justify-content:center">404 · CAMINHO NÃO ENCONTRADO</span>
    <h1>Vamos encontrar outra direção?</h1>
    <p>Esta página não existe ou mudou de endereço.</p>
    <a class="button primary" routerLink="/explorar">Explorar novos caminhos</a>
  </div>`,
})
export class NotFound {}
