import 'reflect-metadata';
import {
  Body,
  Controller,
  Get,
  type INestApplication,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';
import { setupSwagger } from '../src/config/openapi.js';
import { Public } from '../src/modules/auth/auth.guard.js';

class InputFixtureDto {
  @IsInt()
  @Min(1)
  count!: number;
}

// Test-only routes exercise the shared HTTP pipeline; never imported by AppModule.
@ApiExcludeController()
@Public()
@Controller('test-fixture')
class TestFixtureController {
  @Post()
  validate(@Body() body: InputFixtureDto) {
    return { count: body.count, transformed: body instanceof InputFixtureDto };
  }

  @Get('failure')
  fail(): never {
    throw new Error('private internal detail');
  }

  @Get('http-failure')
  failHttp(): never {
    throw new InternalServerErrorException('private HTTP exception detail');
  }
}

describe('HTTP infrastructure (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestFixtureController],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.useLogger(false);
    configureApp(app);
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('exposes only the versioned health URL and applies security headers', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('X-Content-Type-Options', 'nosniff')
      .expect({ status: 'ok' });
    await request(app.getHttpServer()).get('/api/health').expect(404);
    await request(app.getHttpServer()).get('/api/v2/health').expect(404);
  });

  it('returns a consistent 404 without reflecting query parameters in path', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/missing?secret=omit')
      .expect(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/api/v1/missing',
      timestamp: expect.any(String) as unknown,
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it.each(['failure', 'http-failure'])('hides unexpected internal errors: %s', async (route) => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/test-fixture/${route}`)
      .expect(500);
    expect(response.body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal Server Error',
    });
    expect(response.text).not.toContain('private');
    expect(response.body).not.toHaveProperty('stack');
  });

  it('transforms DTO instances while rejecting implicit coercion and extra input', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/test-fixture')
      .send({ count: 2 })
      .expect(201)
      .expect({ count: 2, transformed: true });
    await request(app.getHttpServer())
      .post('/api/v1/test-fixture')
      .send({ count: '2' })
      .expect(400);
    const response = await request(app.getHttpServer())
      .post('/api/v1/test-fixture')
      .send({ count: 2, unexpected: 'value' })
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: expect.arrayContaining(['property unexpected should not exist']) as unknown,
    });
  });

  it('rejects malformed JSON and oversized bodies without reporting a server failure', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/test-fixture')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/test-fixture')
      .send({ data: 'x'.repeat(1024 * 1024) })
      .expect(413);
  });

  it('serves Swagger and documents infrastructure and product endpoints', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200).expect('Content-Type', /html/);
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const document = response.body as { paths: Record<string, unknown> };
    expect(Object.keys(document.paths)).toContain('/api/v1/health');
    expect(Object.keys(document.paths)).toContain('/api/v1/auth/register');
    expect(Object.keys(document.paths)).toContain('/api/v1/roadmaps/{id}/graph');
    expect(Object.keys(document.paths).some((path) => path.includes('test-fixture'))).toBe(false);
    expect(document.paths['/api/v1/health']).toMatchObject({
      get: {
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HealthResponseDto' } },
            },
          },
        },
      },
    });
  });
});
