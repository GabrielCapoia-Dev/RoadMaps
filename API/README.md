# BreadCrumbs API v1

API REST NestJS 12, TypeScript estrito e ESM. Base: `/api/v1`. Swagger: `/api/docs`. O contrato gerado é a referência de DTOs, parâmetros e respostas.

## Domínios disponíveis

| Domínio               | Operações                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Autenticação          | Cadastro, reenvio, confirmação de e-mail, login e logout.                                                               |
| Usuários              | Perfil próprio, edição de nome/bio, perfil público, busca de pessoas, seguir/deixar de seguir.                          |
| Onboarding            | Registrar conclusão de forma persistente e idempotente.                                                                 |
| Roadmaps              | Criar, listar próprios/compartilhados/favoritos/seguidos, consultar, editar metadados e excluir.                        |
| Grafos                | Substituição atômica de nós/conexões com revisão esperada.                                                              |
| Compartilhamento      | Listar colaboradores, conceder/alterar papel e revogar acesso.                                                          |
| Publicação e Explorar | Público/privado, busca em texto e grafo, filtros de categoria/tag/autor, novos/populares/em alta e categorias públicas. |
| Progresso             | Consultar e alterar estado individual por nó, com resumo calculado.                                                     |
| Comunidade            | Comentários e respostas, exclusão, curtidas, favoritos e seguir roadmaps.                                               |
| Infraestrutura        | Liveness e prontidão do banco.                                                                                          |

## Autenticação

Cadastre nome, e-mail e senha de 12 a 128 caracteres. O e-mail é normalizado para minúsculas. Antes da confirmação, login retorna `403`. O cadastro envia um link HTTPS de 30 minutos; a página chama `POST /auth/verify-email` com o token, consumido apenas uma vez, e recebe uma sessão autenticada para redirecionar o usuário à plataforma. Reenvio invalida o link anterior. Cadastros duplicados e reenvios respondem com mensagem genérica, sem revelar um token.

O login retorna `accessToken`, `tokenType: Bearer` e `expiresAt`. Envie `Authorization: Bearer <accessToken>` nas rotas protegidas. A sessão dura sete dias e logout a revoga imediatamente. Somente hashes dos tokens ficam no banco; senhas usam scrypt com salt individual. Não são JWTs. Perfis públicos não expõem e-mail, hash de senha, sessão ou progresso.

No desenvolvimento, leia a mensagem em http://localhost:8025. O envio SMTP é síncrono; falha retorna `503` e a conta pode recuperar o fluxo pelo reenvio. Não há fila de e-mails ou retentativa automática. A integração não exige provedor externo para executar localmente. Em produção, configure SMTP real com TLS e `PUBLIC_APP_URL` com a origem HTTPS pública; nunca desabilite validação de certificado.

## Exemplo de roadmap e grafo

Crie um roadmap privado:

```json
{
  "title": "Japonês do zero",
  "description": "Uma trilha de leitura e prática",
  "category": "Idiomas",
  "tags": ["iniciante", "japonês"]
}
```

Use o `id` retornado em `PUT /roadmaps/{id}/graph`:

```json
{
  "expectedRevision": 1,
  "graph": {
    "nodes": [
      {
        "id": "11111111-1111-4111-8111-111111111111",
        "type": "module",
        "title": "Hiragana",
        "description": "Aprender os símbolos básicos",
        "required": true,
        "position": { "x": 120, "y": 80 },
        "color": "#2563EB",
        "shape": "rounded",
        "resources": [{ "label": "Material", "url": "https://example.com/material" }]
      },
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "type": "practice",
        "title": "Leitura",
        "position": { "x": 320, "y": 240 }
      }
    ],
    "edges": [
      {
        "id": "33333333-3333-4333-8333-333333333333",
        "source": "11111111-1111-4111-8111-111111111111",
        "target": "22222222-2222-4222-8222-222222222222",
        "type": "path"
      }
    ]
  }
}
```

A resposta contém a nova revisão. Mover, criar, duplicar ou remover nós significa enviar o grafo resultante completo. Nós duplicados precisam de novos UUIDs. O servidor não fornece operações separadas de canvas nem depende de uma biblioteca visual.

Revisões antigas retornam `409`; o cliente deve recarregar e resolver o conflito, sem reenviar cegamente. Metadados e visibilidade também exigem `expectedRevision`. O `PATCH` preserva campos omitidos e rejeita `null` nos campos editáveis.

São aceitas ramificações, componentes desconectados e ciclos entre nós distintos. Autorrelacionamentos, IDs duplicados e conexões sem nó correspondente são rejeitados. Tipos são identificadores extensíveis de até 40 caracteres, não um enum fixo. Conteúdo é texto simples; links aceitam HTTP/HTTPS e não são buscados pelo servidor. Limites iniciais: 1 MiB por corpo JSON, 1.000 nós, 3.000 conexões e 30 recursos por nó. Esses limites operacionais não são garantias de performance do futuro editor.

## Papéis e visibilidade

| Ação                               | Proprietário | Editor | Comentador | Visualizador | Usuário externo em roadmap público |
| ---------------------------------- | ------------ | ------ | ---------- | ------------ | ---------------------------------- |
| Ler                                | Sim          | Sim    | Sim        | Sim          | Sim, inclusive anônimo             |
| Editar metadados/grafo             | Sim          | Sim    | Não        | Não          | Não                                |
| Publicar/privatizar/excluir        | Sim          | Não    | Não        | Não          | Não                                |
| Gerenciar colaboradores            | Sim          | Não    | Não        | Não          | Não                                |
| Listar colaboradores               | Sim          | Sim    | Não        | Não          | Não                                |
| Comentar                           | Sim          | Sim    | Sim        | Não          | Sim, autenticado                   |
| Registrar progresso próprio/reagir | Sim          | Sim    | Sim        | Sim          | Sim, autenticado                   |

O papel explícito de visualizador impede comentários mesmo em um roadmap público. Colaboradores são adicionados por UUID de uma conta já confirmada. Não há convite por e-mail nem transferência de propriedade. Revogação é aplicada às próximas operações. Em roadmaps privados, visitantes sem relação recebem `404` para evitar divulgação de existência. Favoritos de conteúdo que deixou de ser acessível não aparecem nas listagens.

Publicação expõe o estado atual do roadmap; não existe snapshot de publicação independente do rascunho. As únicas visibilidades implementadas são `private` e `public`. Link não listado fica para uma etapa futura.

## Progresso e comunidade

`GET /roadmaps/{id}/progress/me` e `PUT /roadmaps/{id}/progress/me/nodes/{nodeId}` trabalham somente com o usuário da sessão. Estados: `not_started`, `in_progress`, `completed`. O percentual considera nós obrigatórios; se todos forem opcionais, considera todos. Grafo vazio retorna 0%. Excluir nós apaga os registros de progresso correspondentes na mesma transação. Conexões não bloqueiam conclusão nem representam pré-requisitos executáveis.

Comentários têm texto simples e até um nível de respostas. Somente autor ou proprietário podem excluir; excluir um comentário principal remove suas respostas. Reações usam `PUT`/`DELETE` idempotentes nos tipos `like`, `favorite` e `follow`. Favoritos são privados: a API retorna apenas os do solicitante, sem expor quem salvou.

Onboarding: `PUT /users/me/onboarding` grava a primeira conclusão; chamadas repetidas preservam a data. A API não trata pular como concluir e não executa o tour visual.

## Busca, paginação e erros

Listagens recebem `page` (1 a 10.000) e `limit` (1 a 50, padrão 20), retornando `items`, `page`, `limit` e `hasMore`. A busca pública usa PostgreSQL full-text com configuração `simple` sobre título, descrição e strings do grafo. Busca de pessoas usa nome; categorias/tags têm filtros exatos. Nenhuma busca pública inclui roadmaps privados.

`sort=newest` usa publicação; `popular` usa curtidas e seguidores; `trending` usa essas interações nos últimos sete dias. São regras iniciais determinísticas, sem recomendação personalizada ou promessa de ranking resistente a manipulação.

Erros da API usam `statusCode`, `error`, `message`, `path` e `timestamp`. Dados inválidos: `400`; sessão inválida: `401`; permissão: `403`; inexistência/privacidade: `404`; revisão: `409`; corpo excessivo: `413`; limite de chamadas: `429`; dependência indisponível: `503`. Falhas internas não retornam stack traces. Rejeições produzidas diretamente pelo proxy, antes da API, podem ter corpo próprio do Nginx.

O limite padrão é 120 chamadas/minuto por IP e rota; rotas de autenticação usam 8/minuto. Health checks são isentos. O armazenamento de limites é em memória por processo. Execução nativa ignora cabeçalhos encaminhados por padrão; `TRUST_PROXY=true` confia em exatamente um proxy e só deve ser usado quando ele controla o acesso direto à API.

## Executar e testar

```bash
# Na raiz, serviços para execução nativa:
docker compose up -d --wait postgres mailpit
# Dentro de API/:
npm ci
npm run start:dev
npm run db:migrate
npm run lint
npm test
npm run test:e2e
npm run build
npm run docs:openapi
npm run smoke:product
```

`start:dev` e `start:prod` aplicam migrações antes de executar. O exportador OpenAPI não abre porta e não exige conexão com o banco. `TEST_DATABASE_URL` define o banco de testes; cada execução usa schema exclusivo com limpeza posterior. Testes não apagam dados do schema normal. O smoke de produto é local, usa Nginx/PostgreSQL/Mailpit e remove apenas suas próprias fixtures.

Configuração via processo, `.env` da raiz e `API/.env`: `DATABASE_URL`, `NODE_ENV`, `HOST`, `PORT`, `SWAGGER_ENABLED`, `TRUST_PROXY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`. Não exponha credenciais em respostas ou versionamento. Configuração de produção rejeita credenciais locais conhecidas e requer banco/SMTP/remetente explícitos.

## Limites desta entrega

A API entrega a primeira versão funcional desses domínios. Não inclui frontend de produto, edição simultânea em tempo real, snapshots/versionamento de publicações, cópia de roadmaps, upload de arquivos, recomendação personalizada, notificações, denúncias/moderação administrativa, recuperação de senha, MFA, exclusão de conta ou convites externos. Essas capacidades exigem contratos próprios; não estão simuladas.

Decisões e fontes: [API v1](../docs/architecture/api-v1.md). Resultados e restrições operacionais: [validação](../docs/validation.md).
