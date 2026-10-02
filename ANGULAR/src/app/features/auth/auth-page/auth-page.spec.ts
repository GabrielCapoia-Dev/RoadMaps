import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../../core/api';
import { Session } from '../../../core/session';
import { AuthPage } from './auth-page';
describe('Account forms', () => {
  function setup(mode: string, token = '') {
    const api = { post: vi.fn().mockResolvedValue({}) };
    const session = {
      login: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Api, useValue: api },
        { provide: Session, useValue: session },
        { provide: Router, useValue: { navigate: vi.fn(), navigateByUrl: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { mode }, queryParamMap: new Map([['token', token]]) } },
        },
      ],
    });
    return { page: TestBed.runInInjectionContext(() => new AuthPage()), api, session };
  }
  it('validates only fields used by login', () => {
    const { page } = setup('login');
    page.model.set({
      name: '',
      email: 'aluno@example.com',
      password: 'senha-com-12-caracteres',
      token: '',
    });
    expect(page.fields().valid()).toBe(true);
  });
  it('blocks a short password and empty name during registration', () => {
    const { page } = setup('register');
    page.model.set({ name: '', email: 'aluno@example.com', password: 'curta', token: '' });
    expect(page.fields().valid()).toBe(false);
    page.model.set({
      name: 'Aluno',
      email: 'aluno@example.com',
      password: 'senha-com-12-caracteres',
      token: '',
    });
    expect(page.fields().valid()).toBe(true);
  });
  it('allows verification without unrelated account fields', () => {
    const { page } = setup('verify');
    page.model.update((m) => ({ ...m, token: 'a'.repeat(64) }));
    expect(page.fields().valid()).toBe(true);
  });
  it('confirms a valid email link automatically', async () => {
    const { page, api, session } = setup('verify', 'a'.repeat(64));
    page.ngOnInit();
    await vi.waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'a'.repeat(64) }),
    );
    expect(session.start).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });
});
