import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('Application routing', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App], providers: appConfig.providers });
  });

  it('renders the lazy technical page in the application outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('Ambiente preparado');
  });

  it('redirects unknown URLs to the environment page', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/unknown-page');
    await fixture.whenStable();

    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('Ambiente preparado');
  });
});
