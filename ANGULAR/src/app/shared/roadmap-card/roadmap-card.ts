import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import type { RoadmapSummary } from '../../core/models';
@Component({
  selector: 'app-roadmap-card',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <a
    class="roadmap-card"
    [routerLink]="[template() ? '/modelos' : '/roadmaps', roadmap().id]"
  >
    <div [class]="'card-art ' + theme()">
      <span class="art-circle"></span><span class="art-line"></span><span class="art-diamond"></span
      ><app-icon [name]="icon()" /><span class="art-label">{{
        roadmap().category || 'Conhecimento'
      }}</span>
    </div>
    <div class="card-body">
      <h3>{{ roadmap().title }}</h3>
      <p>{{ roadmap().description || 'Uma nova trilha de conhecimento para explorar.' }}</p>
      <div class="card-author">
        <span class="avatar small">{{ template() ? 'B' : roadmap().authorName.slice(0, 1) }}</span
        ><span>{{ template() ? 'BreadCrumbs · Modelo' : roadmap().authorName }}</span>
      </div>
      <div class="card-footer">
        <span><app-icon name="layers" />{{ roadmap().nodeCount }} etapas</span>
        @if (template()) {
          <span class="link-text">Explorar <app-icon name="arrow" /></span>
        } @else {
          <span><app-icon name="heart" />{{ roadmap().likes }}</span>
        }
      </div>
    </div></a
  >`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class RoadmapCard {
  readonly roadmap = input.required<RoadmapSummary>();
  readonly template = input(false);
  readonly theme = input('blue');
  readonly icon = input('map');
}
