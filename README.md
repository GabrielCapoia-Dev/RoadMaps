# BreadCrumbs — API e ambiente de desenvolvimento

**Crie, compartilhe e siga trilhas de conhecimento.** Plataforma de aprendizado com roadmaps em grafo, colaboração e comunidade, aberta a qualquer assunto.

A API já implementa contas com confirmação de e-mail, sessões revogáveis, perfis, roadmaps, grafos, publicação, permissões, busca, progresso individual, comentários, favoritos, curtidas e seguidores. O Angular continua na página técnica; as telas de produto serão construídas em etapa própria.

## Iniciar

Pré-requisitos: Docker com containers Linux e Compose v2.24+. Os padrões locais funcionam sem `.env`.

```bash
docker compose up -d --build --wait
docker compose ps
```

| Recurso                    | Endereço                                  |
| -------------------------- | ----------------------------------------- |
| Aplicação / página técnica | http://localhost:8080                     |
| Swagger da API             | http://localhost:8080/api/docs            |
| OpenAPI                    | http://localhost:8080/api/docs-json       |
| Liveness                   | http://localhost:8080/api/v1/health       |
| Prontidão do banco         | http://localhost:8080/api/v1/health/ready |
| E-mails locais (Mailpit)   | http://localhost:8025                     |
| PostgreSQL local           | localhost:5432                            |

A API fica atrás do Nginx, sem porta publicada. Banco, SMTP e Mailpit são publicados somente em loopback no desenvolvimento. E-mails locais são capturados no Mailpit e não enviados a destinatários externos. PostgreSQL usa o volume `postgres_data`; parar/recriar containers preserva os dados.

As migrações versionadas são aplicadas antes de `start:dev`/`start:prod`, com trava e checksum. Não use remoção de volumes para atualizar o schema. Credenciais locais estão em `.env.example`; produção exige credenciais próprias.

## Experimentar a API

1. No Swagger, execute `POST /api/v1/auth/register` com nome, e-mail e senha de 12 a 128 caracteres.
2. Abra o Mailpit, copie o token da mensagem e envie-o em `POST /api/v1/auth/verify-email`.
3. Execute `POST /api/v1/auth/login` e cole o `accessToken` em **Authorize** no Swagger, sem acrescentar `Bearer` ao valor.
4. Crie um roadmap e salve seu grafo por `PUT /roadmaps/{id}/graph`, informando `expectedRevision`.

O e-mail usa um token para teste da API; ainda não existe tela de confirmação no Angular. O [guia da API](API/README.md) descreve endpoints, exemplos, regras e execução nativa. As [decisões desta implementação](docs/architecture/api-v1.md) distinguem escolhas iniciais de requisitos do brief.

## Arquitetura

```text
Navegador → Nginx :8080 → Angular :4200 (desenvolvimento)
                       → NestJS :3000 → PostgreSQL :5432
                                      → Mailpit :1025 (somente desenvolvimento)
```

Backend NestJS 12, ESM e TypeScript estrito, organizado por domínio: controller → service → repository → PostgreSQL. O driver `pg` utiliza SQL parametrizado e transações; grafos ficam em JSONB, independentes do renderer. Angular 22 permanece standalone e zoneless. Node 24 LTS, Nginx e imagens de banco/e-mail estão fixados nos arquivos de build/Compose; versões npm exatas estão nos lockfiles.

```text
API/src/modules/        # auth, users, roadmaps, progress, community
API/src/infrastructure/ # database e health
API/migrations/         # SQL versionado, sem reset automático
API/scripts/            # migrações, OpenAPI e smoke de produto
ANGULAR/                # frontend; página técnica nesta etapa
nginx/                  # gateway
scripts/                # geração Postman e smoke HTTP
docs/product/           # contexto oficial e brief preservado
docs/design/            # guia visual e imagens oficiais
docs/architecture/      # decisões e alternativas
docs/openapi/           # contrato gerado
docs/postman/           # collection gerada
```

## Verificar alterações

```bash
npm ci
npm --prefix API ci
npm --prefix ANGULAR ci
npm run lint
npm test
npm run build
npm run format:check
npm run docs:generate
npm run smoke
npm --prefix API run smoke:product
```

Os testes de integração de produto precisam do PostgreSQL local. Criam um schema exclusivo por execução, aplicam migrações e removem somente esse schema ao terminar. `TEST_DATABASE_URL` permite usar outro banco de testes. O smoke de produto usa o ambiente local completo, incluindo Mailpit, e remove apenas os dados que ele próprio criou.

Para testar dentro do container: `docker compose exec -e TEST_DATABASE_URL=postgresql://breadcrumbs:breadcrumbs_local@postgres:5432/breadcrumbs api npm run test:e2e`. Ajuste a senha caso tenha alterado o padrão. Build e dependências ficam separados entre API e Angular. Mudanças nos manifests/Dockerfiles exigem rebuild; fontes têm hot reload.

## Produção

`docker-compose.production.yml` é uma stack independente. Antes de iniciá-la, configure `POSTGRES_PASSWORD` com uma senha própria, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM` e, se exigido pelo provedor, `SMTP_USER`/`SMTP_PASSWORD`. Senhas em URLs precisam de percent-encoding quando contêm caracteres reservados: nesse caso, configure `DOCKER_DATABASE_URL` com a senha codificada e host `postgres`, mantendo `POSTGRES_PASSWORD` com o valor original. A stack de produção não inclui Mailpit nem publica o banco.

```bash
docker compose -f docker-compose.production.yml up -d --build --wait
```

Pare o desenvolvimento antes de reutilizar a porta 8080 ou escolha outro `HTTP_PORT`. API/Angular usam artefatos compilados, processos sem root e filesystem somente leitura. Migrações são transacionais; backups continuam sendo responsabilidade operacional. O envio de e-mail exige TLS validado em produção. Swagger fica desligado por padrão; `PRODUCTION_SWAGGER_ENABLED=true` permite habilitação explícita.

Deploy público, domínio, TLS do gateway, provedor SMTP real e backups não foram configurados. O limite de requisições atual usa memória por processo; múltiplas réplicas exigirão armazenamento compartilhado. Consulte as limitações concretas em [validação](docs/validation.md).

## Contexto e continuidade

- [Produto e brief oficial](docs/product/README.md)
- [Guia visual BreadCrumbs](docs/design/README.md)
- [Decisões da API v1](docs/architecture/api-v1.md)
- [Comparação de editores visuais](docs/architecture/graph-editor-options.md)
- [Skills avaliadas](docs/architecture/skills.md)

Identificadores técnicos legados como `roadmaps-api`, o nome do Compose e o arquivo Postman foram preservados; a marca é BreadCrumbs. O contexto global orienta futuras etapas sem obrigar implementação simultânea de toda a visão.
