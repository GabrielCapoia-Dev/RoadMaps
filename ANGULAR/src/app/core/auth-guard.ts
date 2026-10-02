import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Session } from './session';
export const authGuard: CanActivateFn = async (_route, state) => {
  const session = inject(Session);
  const router = inject(Router);
  await session.restore();
  return session.user()
    ? true
    : router.createUrlTree(['/entrar'], { queryParams: { next: state.url } });
};
export function safeNext(path: string | null): string {
  return path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
    ? path
    : '/meus-roadmaps';
}
