# Validação BreadCrumbs

Verificado em 01/10/2026, horário de São Paulo. Os registros da fundação abaixo são históricos; a etapa posterior implementou a API de produto.

## API de produto — resultados

- 19 testes de configuração e 22 testes de integração HTTP aprovados, incluindo 15 cenários de produto com PostgreSQL real; 6 testes do Angular também passaram. Total: 47.
- Cenários de produto: confirmação/reenvio/expiração, hashes e revogação de sessão, DTOs e campos não autorizados, grafos ramificados/desconectados, UUIDs duplicados, referências inválidas, concorrência com 409, preservação de PATCH, papéis e revogação, busca pública, progresso isolado, comentários, favoritos, perfis, onboarding, cascatas e rate limiting.
- Testes criam schemas exclusivos e aplicam migrações duas vezes para conferir idempotência. Removem somente seus próprios schemas. Não houve reset do banco de desenvolvimento.
- Smoke real pelo Nginx: cadastro → SMTP/Mailpit → confirmação → login → grafo persistido → progresso → exclusão da fixture → logout. Dados e mensagem criados pelo smoke são limpos ao terminar.
- ESLint da API/Angular aprovado; builds de API e Angular aprovados na stack de produção. A configuração Compose de desenvolvimento/produção foi validada.
- Produção foi testada isoladamente em 8081, projeto `breadcrumbs-api-check`: quatro serviços saudáveis, migrações aplicadas, readiness e consulta pública aprovadas, Swagger 404 e API executando como usuário `node` (UID 1000).
- `npm audit --omit=dev` da API não apontou vulnerabilidades nesta execução. Isso não substitui auditoria de segurança ou varredura das imagens.
- Build nativo, lint e formatação globais aprovados. OpenAPI registra 34 operações; duas gerações consecutivas do Postman produziram o mesmo SHA-256 após fornecer exemplos determinísticos ao conversor. Links locais e `git diff --check` aprovados.

A stack temporária de produção foi encerrada, preservando seu volume. O desenvolvimento permanece em 8080, com PostgreSQL e Mailpit locais. Nenhuma imagem foi publicada e não houve deploy externo.

O SMTP real de um provedor externo não foi configurado nem testado. O teste de produção verificou inicialização/HTTP/banco; envio foi validado somente no ambiente local com Mailpit. O frontend de produto continua pendente. Limitações e regras iniciais estão em [API v1](architecture/api-v1.md) e no [guia da API](../API/README.md).

## Resultados da fundação (histórico)

- NestJS: build, TypeScript estrito, ESLint, 18 testes de configuração e 6 testes HTTP aprovados.
- Angular: build de produção, ESLint e 6 testes de HTTP/roteamento/página técnica aprovados.
- Os 30 testes também passaram nos containers Linux com Node 24.21.0.
- Compose de desenvolvimento e produção: configuração validada; imagens construídas e três containers saudáveis em cada stack.
- Smoke de desenvolvimento: Angular, health versionado, erro JSON 404, Swagger UI e OpenAPI pelo Nginx em 8080.
- Navegador: botão retornou “API disponível”; Swagger exibiu a única operação e os schemas, sem erros no console.
- Smoke de produção: frontend/API pelo Nginx em 8081; Swagger retornou 404 conforme o padrão.
- `nginx -t` aprovado no gateway e servidor estático. Processos como `node` ou `nginx`, sem root.
- OpenAPI e Postman gerados, inclusive conversor via Docker. Gerações consecutivas produziram collection idêntica após remoção de IDs aleatórios e exemplos explícitos.
- Workflow GitHub Actions preparado; não houve push nem execução remota. Checks equivalentes executados localmente.

A stack de produção foi temporária e encerrada após os testes. Desenvolvimento permanece em http://localhost:8080.

## Etapa de contexto BreadCrumbs

Ainda em 01/10/2026, a documentação foi atualizada com o brief oficial, guia visual e implicações arquiteturais. O estado dos três serviços de desenvolvimento foi conferido como saudável e `npm run smoke` passou novamente. Código da aplicação, contratos HTTP e dependências não foram alterados nesta etapa documental; a suíte completa acima não foi repetida.

`npm run format:check` e `git diff --check` passaram. Os destinos dos links locais dos documentos foram verificados. O brief e as três imagens preservados no repositório tiveram SHA-256 comparado com os arquivos fornecidos, sem diferenças.

A pesquisa de bibliotecas é documental: não houve instalação, benchmark ou prova de conceito de editor. Os contrastes da paleta foram calculados para cores sólidas; não houve auditoria de uma interface de produto, que ainda não foi implementada.

## Dependências e limites

`npm audit` não apontou vulnerabilidades na API nem no Angular nesta verificação. Isso não equivale a uma auditoria de segurança completa.

O conversor opcional `openapi-to-postmanv2@6.3.3` tem dependências transitivas com **4 alertas altos e 2 moderados** na árvore de ferramentas da raiz: Faker, js-yaml, uuid e yaml (a contagem inclui pacotes dependentes). A versão publicada do SDK Postman ainda fixa dependências antigas. Não foi aplicado downgrade automático nem override entre versões maiores, que poderia quebrar a conversão.

Essa ferramenta recebe somente o JSON produzido pelo backend, por caminho fixo, e fica no desenvolvimento/perfil `tools`. Não entra nas imagens da API/Angular nem recebe documentos enviados por usuários. **Não usar com especificações de terceiros não confiáveis.** Atualizar/reavaliar antes de expandir o uso. Alternativa sem executar o conversor local: importar `docs/openapi/openapi.json` diretamente no Postman.

Referência: [alerta de Faker](https://github.com/advisories/GHSA-qxc2-j82w-r537). Detalhes atuais: `npm audit` na raiz.

A varredura de imagens com Docker Scout foi tentada, mas requer login Docker neste computador. **A inspeção de CVEs das imagens não foi concluída**; nenhuma credencial foi solicitada e nenhuma imagem foi publicada. Reavaliar as imagens antes de deploy público.

## Recuperação do Docker Desktop

O Desktop falhava antes de iniciar o engine ao abrir `Docker/run/dockerInference` e `docker-secrets-engine/engine.sock`. Com o Desktop encerrado, somente os diretórios desses endpoints foram renomeados com sufixo `backup-roadmaps-<data/hora>` e preservados. Os dois precisavam ser recriados na mesma inicialização; o engine voltou a responder.

Não houve factory reset, exclusão de volumes/imagens, alteração de credenciais ou dos dados WSL. Backups permanecem no perfil local, fora do repositório. Há relatos no [repositório oficial Docker](https://github.com/docker/desktop-feedback/issues/625). A correção resolveu esta sessão, sem garantia contra recorrência após reiniciar o Desktop.
