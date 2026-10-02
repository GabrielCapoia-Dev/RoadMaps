import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BreadCrumbs API')
    .setDescription(
      'Contas verificadas, sessões revogáveis, roadmaps em grafo, colaboração, progresso individual e comunidade. Texto de conteúdo é simples, sem HTML. Paginação por page/limit, até 50 itens. Bearer é um token opaco obtido em auth/login.',
    )
    .setVersion('1.0.0')
    .addTag('infrastructure', 'Validação técnica do ambiente')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, { extraModels: [ErrorResponseDto] });
  for (const path of Object.values(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = path[method];
      if (!operation) continue;
      for (const [status, description] of Object.entries({
        '400': 'Entrada inválida',
        '401': 'Sessão ausente, inválida ou expirada',
        '403': 'Permissão insuficiente',
        '404': 'Recurso inexistente ou sem visibilidade',
        '409': 'Revisão desatualizada',
        '413': 'Corpo maior que 1 MiB',
        '429': 'Limite de requisições excedido',
        '500': 'Falha interna',
        '503': 'Dependência indisponível',
      })) {
        operation.responses[status] ??= {
          description,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponseDto' } },
          },
        };
      }
    }
  }
  return document;
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs-json',
    raw: ['json'],
    swaggerOptions: { persistAuthorization: false },
  });
}
