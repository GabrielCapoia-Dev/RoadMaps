import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './config/configure-app.js';
import type { Environment } from './config/environment.js';
import { setupSwagger } from './config/openapi.js';
import { Database } from './infrastructure/database/database.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);
  configureApp(app);
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    setupSwagger(app);
  }

  await app.get(Database).ready();
  await app.listen(config.get('PORT', { infer: true }), config.get('HOST', { infer: true }));
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Bootstrap failed');
  process.exitCode = 1;
});
