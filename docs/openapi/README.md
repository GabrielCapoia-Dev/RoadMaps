# OpenAPI

`openapi.json` é gerado pela configuração Swagger NestJS usada em `/api/docs` e `/api/docs-json`. Controllers e DTOs são a fonte de verdade, incluindo sessões Bearer, parâmetros, schemas de entrada/saída e erros.

Execute `npm run docs:generate` na raiz. O exportador não abre porta nem precisa de banco disponível. O contrato agora abrange autenticação, usuários, roadmaps, Explorar, progresso, comunidade e infraestrutura.

Não edite o JSON manualmente. Alterações HTTP devem atualizar decorators, testes relevantes e os artefatos OpenAPI/Postman. O [guia da API](../../API/README.md) explica o fluxo de confirmação e uso do token.
