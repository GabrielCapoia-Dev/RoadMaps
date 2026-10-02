import 'reflect-metadata';
import { mkdir, writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/config/configure-app.js';
import { createOpenApiDocument } from '../dist/config/openapi.js';

const app = await NestFactory.create(AppModule, { logger: false });
try {
  configureApp(app);
  await app.init();
  const directory = new URL('../../docs/openapi/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL('openapi.json', directory),
    `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`,
  );
  console.log('OpenAPI exportado para docs/openapi/openapi.json (sem abrir porta).');
} finally {
  await app.close();
}
