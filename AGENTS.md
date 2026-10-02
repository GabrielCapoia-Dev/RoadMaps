# Contexto do projeto

O produto é **BreadCrumbs**: “Crie, compartilhe e siga trilhas de conhecimento”.

Leia o [contexto do produto](docs/product/README.md), o [brief integral](docs/product/brief-oficial.txt) e o [guia visual oficial](docs/design/README.md) conforme a tarefa. As imagens em `docs/design/references/` são referências oficiais fornecidas pelo usuário. O protótipo Roadmap_DBA é histórico e secundário.

## Escopo incremental

A visão global não autoriza implementar todas as funcionalidades. Siga a etapa solicitada pelo usuário. Após a fundação, o usuário solicitou a API: contas, roadmaps, permissões, progresso e comunidade agora estão implementados no backend. Consulte `docs/architecture/api-v1.md` e `API/README.md` para regras atuais. O usuário também autorizou o frontend Angular de produto, agora implementado. Consulte `ANGULAR/README.md` e `docs/architecture/frontend-v1.md`.

Não invente silenciosamente requisitos importantes. Distinga requisitos confirmados, propostas técnicas e questões abertas. Não crie módulos, entidades ou dependências apenas para antecipar a visão completa.

## Diretrizes de produto e arquitetura

- Roadmaps representam grafos de nós e conexões, não apenas listas. O produto abrange qualquer assunto, não somente tecnologia.
- Preserve Docker/Compose/Nginx, NestJS em `API/` e Angular em `ANGULAR/`.
- Backend modular por domínio, controllers enxutos, regras nos services e persistência isolada quando necessária.
- Angular standalone, zoneless e organizado por feature; componentes e serviços com responsabilidades claras.
- Mantenha o modelo de roadmap independente de bibliotecas visuais. Compare compatibilidade, licença, manutenção, performance e acessibilidade antes de adotar uma biblioteca importante; veja `docs/architecture/graph-editor-options.md`.
- Tema inicial claro, linguagem visual das referências oficiais e paleta base `#0F2D5B`, `#2563EB`, `#14B8A6`, `#F472B6`, `#F4F6F8`. Não deduza dark mode das variantes de logo.
- Considere responsividade, teclado, foco, contraste e estados além de cor na implementação de interfaces.
- Permissões futuras precisam ser aplicadas no backend. Não confunda visibilidade pública, colaboração e progresso de aprendizado.

## Validação e documentação

Consulte os comandos e limitações atuais no `README.md` e em `docs/validation.md`. Execute verificações adequadas à alteração, sem repetir toda a suíte por mudanças exclusivamente documentais. Alterações de contratos HTTP devem regenerar OpenAPI/Postman pelo fluxo existente. Registre decisões relevantes em `docs/architecture/` e mantenha propostas identificadas como propostas.
