import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { EnvironmentPage } from './environment-page';

describe('EnvironmentPage', () => {
  let fixture: ComponentFixture<EnvironmentPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [EnvironmentPage],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EnvironmentPage);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('checks the API only when requested and reports success', async () => {
    http.expectNone('/api/v1/health');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'API disponível.',
    );
    expect(button.disabled).toBe(false);
  });

  it('shows a recoverable error when the backend is unavailable', async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    http.expectOne('/api/v1/health').flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Não foi possível confirmar a disponibilidade da API.',
    );
    expect(button.disabled).toBe(false);

    button.click();
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'API disponível.',
    );
  });
});
