import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { API_BASE_URL } from './api-base-url';

@Service()
export class ApiHealth {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  check() {
    return this.http.get<unknown>(`${this.baseUrl}/health`, { timeout: 5000 }).pipe(
      map((response) => {
        if (
          typeof response !== 'object' ||
          response === null ||
          !('status' in response) ||
          response.status !== 'ok'
        ) {
          throw new Error('Resposta de health inválida.');
        }

        return true;
      }),
    );
  }
}
