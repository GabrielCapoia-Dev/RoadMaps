import { ChangeDetectionStrategy, Component, input } from '@angular/core';
const paths: Record<string, string> = {
  search: 'm21 21-5-5 M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M16 8l-3 5-5 3 3-5z',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
  book: 'M12 5v16 M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z',
  bookmark: 'M6 3h12v19l-6-4-6 4z',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  back: 'M19 12H5 m5-5-5 5 5 5',
  check: 'm5 12 4 4L19 6',
  x: 'm6 6 12 12 M6 18 18 6',
  code: 'm8 7-5 5 5 5 m8-10 5 5-5 5 m-3-14-2 18',
  layers: 'm12 3 10 6-10 6L2 9z M2 13l10 6 10-6 M2 17l10 6 10-6',
  sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z M20 2v4 M18 4h4',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2c6 6 6 14 0 20-6-6-6-14 0-20',
  camera: 'M3 6h4l2-3h6l2 3h4v15H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  logout: 'M9 21H3V3h6 M9 12h12 m-5-5 5 5-5 5',
  mail: 'M3 5h18v14H3z m0 0 9 8 9-8',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  share:
    'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M9 10l6-4 M9 14l6 4',
  play: 'm8 4 12 8-12 8z',
  edit: 'm16 3 5 5-12 12-6 1 1-6z M14 5l5 5',
  trash: 'M3 6h18 M5 6l1 15h12l1-15 M9 6V3h6v3 M10 10v7 M14 10v7',
  link: 'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-3 3 M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l3-3',
  heart: 'M20 4a5 5 0 0 0-8 2 5 5 0 0 0-8-2c-5 5 1 10 8 16 7-6 13-11 8-16z',
  message: 'M21 3H3v15h5l4 4 4-4h5z',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  help: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 17v1',
  filter: 'M3 6h18 M6 12h12 M9 18h6',
  undo: 'M9 4 3 10l6 6 M3 10h12a6 6 0 0 1 0 12',
  redo: 'm15 4 6 6-6 6 M21 10H9a6 6 0 0 0 0 12',
  minus: 'M5 12h14',
  fit: 'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5',
  save: 'M19 21H5a2 2 0 0 1-2-2V3h14l4 4v12a2 2 0 0 1-2 2 M7 3v6h10V3 M7 21v-8h10v8',
  flag: 'M4 22V3h16l-4 5 4 5H4',
  briefcase: 'M3 7h18v14H3z M8 7V3h8v4 M3 12h18',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1',
};
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="paths[name()] || paths['map']" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input('map');
  protected readonly paths = paths;
}
