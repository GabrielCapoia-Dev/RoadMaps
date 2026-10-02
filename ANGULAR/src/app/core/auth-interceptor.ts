import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { TokenStore } from './token-store';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(TokenStore);
  const token = store.token();
  const url = new URL(request.url, window.location.origin);
  const api = url.origin === window.location.origin && url.pathname.startsWith('/api/v1/');
  return next(
    api && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request,
  ).pipe(
    catchError((error: unknown) => {
      if (
        api &&
        token &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        store.token() === token
      )
        store.clear();
      return throwError(() => error);
    }),
  );
};
export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Não foi possível concluir. Tente novamente.';
  if (error.status === 0)
    return 'Não foi possível conectar. Confira sua conexão e tente novamente.';
  if (error.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (error.status === 403) return 'Você não tem permissão para esta ação.';
  if (error.status === 404)
    return 'Este conteúdo não foi encontrado ou não está disponível para você.';
  if (error.status === 409)
    return 'Outra pessoa alterou esta trilha. Recarregue a versão atual antes de salvar.';
  if (error.status === 429)
    return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.';
  if (error.status >= 500)
    return 'O serviço está indisponível no momento. Tente novamente em instantes.';
  const body = error.error as { message?: unknown };
  return typeof body?.message === 'string' ? body.message : 'Confira os campos e tente novamente.';
}
