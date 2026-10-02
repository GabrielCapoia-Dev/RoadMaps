import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { ApiHealth } from './api-health';

describe('ApiHealth', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/configured-api/v1' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the configured API base and accepts the backend health contract', async () => {
    const result = firstValueFrom(TestBed.inject(ApiHealth).check());
    const request = http.expectOne('/configured-api/v1/health');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'ok' });

    await expect(result).resolves.toBe(true);
  });

  it('rejects an unexpected response instead of reporting a healthy API', async () => {
    const result = firstValueFrom(TestBed.inject(ApiHealth).check());
    const assertion = expect(result).rejects.toThrow('Resposta de health inválida.');
    http.expectOne('/configured-api/v1/health').flush({ unrelated: true });

    await assertion;
  });
});
