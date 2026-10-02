import {
  type INestApplication,
  PayloadTooLargeException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { json, type Request, type Response, type NextFunction } from 'express';

export function configureApp(app: INestApplication): void {
  // Compose trusts exactly one proxy; native execution ignores forwarded headers by default.
  const server = app.getHttpAdapter().getInstance() as { set(name: string, value: unknown): void };
  server.set('trust proxy', app.get(ConfigService).get<boolean>('TRUST_PROXY') ? 1 : false);
  app.use(json({ limit: '1mb' }));
  app.use((error: unknown, _request: Request, _response: Response, next: NextFunction) => {
    if (error instanceof Error && 'type' in error && error.type === 'entity.too.large')
      next(new PayloadTooLargeException('O corpo JSON excede 1 MiB.'));
    else next(error);
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(
    helmet({
      // HTTPS and HSTS belong to the public TLS proxy; local HTTP must work.
      strictTransportSecurity: false,
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
    }),
  );
}
