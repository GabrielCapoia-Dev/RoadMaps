import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './http/api-base-url';
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  get<T>(path: string, params: Record<string, string | number> = {}) {
    return firstValueFrom(this.http.get<T>(this.base + path, { params }));
  }
  post<T>(path: string, body: unknown = {}) {
    return firstValueFrom(this.http.post<T>(this.base + path, body));
  }
  put<T>(path: string, body: unknown = {}) {
    return firstValueFrom(this.http.put<T>(this.base + path, body));
  }
  patch<T>(path: string, body: unknown) {
    return firstValueFrom(this.http.patch<T>(this.base + path, body));
  }
  delete<T = void>(path: string) {
    return firstValueFrom(this.http.delete<T>(this.base + path));
  }
}
