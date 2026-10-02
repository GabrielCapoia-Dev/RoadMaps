import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img src="/brand-mark.svg" alt="" width="42" height="42" /><span
      >Bread<span class="blue">Crumbs</span></span
    >`,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 21px;
      font-weight: 850;
      letter-spacing: -1px;
      white-space: nowrap;
    }
    .blue {
      color: var(--blue);
    }
    img {
      flex-shrink: 0;
    }
  `,
})
export class Brand {}
