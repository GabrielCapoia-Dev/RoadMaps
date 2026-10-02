import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';
import { Api } from './core/api';
describe('Product routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...appConfig.providers,
        {
          provide: Api,
          useValue: {
            get: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 6, hasMore: false }),
          },
        },
      ],
    });
  });
  it('loads Explore and clearly identifies starter templates', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Seu próximo passo');
    expect(fixture.nativeElement.textContent).toContain('Modelo');
    expect(fixture.nativeElement.querySelectorAll('app-roadmap-card')).toHaveLength(6);
  });
  it('redirects an anonymous reader to login and preserves the return path', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/meus-roadmaps?criar=sim');
    await fixture.whenStable();
    expect(router.url).toBe('/entrar?next=%2Fmeus-roadmaps%3Fcriar%3Dsim');
    expect(fixture.nativeElement.textContent).toContain('Bom ter você por aqui');
  });
});
