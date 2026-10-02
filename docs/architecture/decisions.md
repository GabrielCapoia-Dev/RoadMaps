# Decisões arquiteturais — etapa 1

Registro histórico da fundação. Banco, autenticação e domínios foram acrescentados posteriormente conforme [decisões da API v1](api-v1.md).

O [contexto oficial BreadCrumbs](../product/README.md) complementa esta fundação. Consulte as [implicações para evolução do produto](product-evolution.md) e a [avaliação preliminar de editores de grafos](graph-editor-options.md). Esses documentos não representam funcionalidades já implementadas.

## Backend

Monólito modular com DI nativa do NestJS. A separação controller → service → repository acontecerá dentro de cada módulo de domínio, preservando coesão. DTOs de transporte ficam na fronteira HTTP; modelos de persistência não devem virar respostas públicas automaticamente. Services concentram regras e futuramente dependerão de contratos de persistência injetáveis. Não há base repository genérico, CQRS, event bus ou microserviços.

Bootstrap compartilhado entre runtime, testes e OpenAPI reduz divergência de versão e validação. Configuração inválida interrompe inicialização. Filtro global preserva códigos e mensagens de validação, normaliza erros e oculta detalhes internos. Sucessos não são embrulhados globalmente: GET 200, criação 201, remoção sem corpo 204, entrada inválida 400, ausência 404, conflito 409. Aplicar 401/403 quando houver autenticação real. Paginação terá contrato quando houver requisitos.

Pipes validam/convertem; guards controlam acesso; interceptors tratam aspectos transversais; middlewares estabelecem contexto antes do controller. Diretórios reservados não representam políticas já implementadas.

## Frontend

Standalone, zoneless, roteamento e lazy loading. Organização por feature segue o [guia oficial](https://angular.dev/style-guide). `core` contém infraestrutura global, `shared` não contém domínio e `layouts` comporá a interface. Serviços, interfaces e testes específicos ficam próximos à feature.

`API_BASE_URL=/api/v1`; Nginx ou proxy local resolve o destino. O cliente não embute endereços de containers nem segredos. Interceptors funcionais poderão tratar políticas HTTP. Guards do cliente não substituem autorização no servidor.

Estado local usa signals quando necessário. Store global, grafos, SSR, UI kit e tokens finais dependem de necessidade demonstrada. O protótipo não determina bibliotecas.

## Infraestrutura

Lockfiles e imagens independentes. Nginx publica a única porta, preserva `/api` e permite WebSocket de HMR. DNS Docker é reconsultado para acompanhar recriações. Health checks ordenam inicialização; não substituem monitoração contínua nem reiniciam containers apenas por estarem unhealthy.

Múltiplos estágios separam build/runtime. Desenvolvimento usa mounts de fontes e polling; produção usa artefatos compilados e usuário sem privilégios. Dependências e imagens têm versões registradas. Futuras integrações serão adicionadas com adaptadores, variáveis validadas e health checks, conforme os requisitos.

## Referências oficiais

- [NestJS módulos](https://docs.nestjs.com/modules), [versionamento](https://docs.nestjs.com/techniques/versioning) e [OpenAPI](https://docs.nestjs.com/openapi/introduction).
- [Angular HttpClient](https://angular.dev/guide/http/setup).
- [Docker multi-stage](https://docs.docker.com/build/building/multi-stage/) e [Compose health checks](https://docs.docker.com/compose/how-tos/startup-order/).
- [Nginx proxy HTTP](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
