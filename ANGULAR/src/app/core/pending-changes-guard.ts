import { CanDeactivateFn } from '@angular/router';
export const pendingChangesGuard: CanDeactivateFn<{ dirty: () => boolean }> = (component) =>
  !component.dirty() || window.confirm('Há alterações não salvas. Sair e descartá-las?');
