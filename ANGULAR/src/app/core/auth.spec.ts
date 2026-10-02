import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { TokenStore } from './token-store';
import { authInterceptor } from './auth-interceptor';
import { safeNext } from './auth-guard';
describe('Authentication boundaries', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });
  it('adds the session only to the same-origin product API', async () => {
    TestBed.inject(TokenStore).set('local-test-session', '2099-01-01');
    const http = TestBed.inject(HttpClient);
    const requests = TestBed.inject(HttpTestingController);
    const own = firstValueFrom(http.get('/api/v1/users/me'));
    const request = requests.expectOne('/api/v1/users/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer local-test-session');
    request.flush({});
    await own;
    const external = firstValueFrom(http.get('https://example.com/api/v1/users'));
    const other = requests.expectOne('https://example.com/api/v1/users');
    expect(other.request.headers.has('Authorization')).toBe(false);
    other.flush({});
    await external;
  });
  it('clears an expired session after 401 without swallowing the error', async () => {
    const tokens = TestBed.inject(TokenStore);
    tokens.set('expired-session', '2099-01-01');
    const promise = firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/users/me')).catch(
      (e) => e.status,
    );
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/users/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await promise).toBe(401);
    expect(tokens.token()).toBeUndefined();
    expect(sessionStorage.getItem('breadcrumbs.session')).toBeNull();
  });
  it('does not clear a newer session because an old request failed', async () => {
    const tokens = TestBed.inject(TokenStore);
    tokens.set('old', '2099-01-01');
    const promise = firstValueFrom(TestBed.inject(HttpClient).get('/api/v1/users/me')).catch(
      () => undefined,
    );
    tokens.set('new', '2099-01-01');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/users/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await promise;
    expect(tokens.token()).toBe('new');
  });
  it('rejects expired or malformed stored sessions', () => {
    sessionStorage.setItem(
      'breadcrumbs.session',
      JSON.stringify({ token: 'old', expires: '2000-01-01' }),
    );
    expect(new TokenStore().token()).toBeUndefined();
    sessionStorage.setItem('breadcrumbs.session', 'broken');
    expect(new TokenStore().token()).toBeUndefined();
  });
  it('keeps return navigation within the application', () => {
    expect(safeNext('//evil.example')).toBe('/meus-roadmaps');
    expect(safeNext('https://evil.example')).toBe('/meus-roadmaps');
    expect(safeNext('/\\evil')).toBe('/meus-roadmaps');
    expect(safeNext('/editor/abc')).toBe('/editor/abc');
  });
});
