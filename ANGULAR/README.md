# Angular — BreadCrumbs

Frontend Angular 22 standalone e zoneless integrado à API NestJS, com TypeScript e templates estritos, OnPush, Signals, Signal Forms e rotas sob demanda. Identidade clara baseada nas referências oficiais, fonte Manrope local e paleta BreadCrumbs.

## Executar

Preferencialmente use Docker conforme o [README principal](../README.md):

```bash
docker compose up -d --build --wait
```

Alternativa local, nesta pasta: `npm ci`, `npm start`. O servidor em http://localhost:4200 encaminha `/api` para http://127.0.0.1:3000. No Docker, acesse http://localhost:8080. Recrie o container Angular após mudanças em dependências ou angular.json.

## Fluxos

- `/explorar`: busca e categorias de trilhas públicas; modelos locais identificados como inspiração.
- `/cadastro`, `/confirmar-email`, `/entrar`: conta, código de e-mail e sessão. No desenvolvimento, obtenha o código no Mailpit em http://localhost:8025.
- `/meus-roadmaps`, `/salvos`: trilhas próprias, compartilhadas, favoritas e seguidas; criação privada.
- `/roadmaps/:id`: leitura, mapa, materiais, progresso individual, comentários e reações.
- `/modelos/:id`: prévia de modelo e criação de cópia privada.
- `/editor/:id`: etapas e conexões, posição/cor/materiais, desfazer/refazer, metadados, publicação e permissões.
- `/comunidade`, `/pessoas/:id`, `/perfil`: busca de pessoas, perfis públicos, seguir/deixar de seguir e edição do próprio perfil.
- `/ambiente`: diagnóstico técnico anterior, preservado.

O editor usa salvamento explícito. Aplique os detalhes de uma etapa antes de salvar a trilha. O guard e o aviso do navegador protegem a saída com alterações; conflitos HTTP 409 mantêm o grafo local e oferecem baixar o rascunho ou recarregar. Metadados e grafo são duas operações versionadas: se somente a segunda falhar, a atualização dos metadados já persistiu. O salvamento não é colaboração em tempo real.

## Organização

- `core/`: cliente HTTP tipado, sessão, interceptor, guards, contratos e modelos de inspiração.
- `layouts/shell/`: navegação, busca global e conta.
- `features/`: componentes de cada fluxo.
- `shared/`: marca, ícones, cards, canvas, tour e página 404.
- `src/styles.scss`: tokens e estilos responsivos; `public/brand-mark.svg`: adaptação vetorial da referência.
- Foblex Flow renderiza/interage com o mapa; o contrato Graph, permissões, revisões e histórico pertencem à aplicação.

O token fica no sessionStorage da aba. O interceptor só o transmite à API na mesma origem. Guards não substituem a autorização do backend. A leitura do roadmap retorna capacidades de acesso para orientar os controles.

## Verificação

```bash
npm run build
npm run lint
npm test -- --watch=false
```

Testes cobrem sessão e retorno seguro, formulários, roteamento, histórico, cascata de conexões e conflitos de revisão. Consulte [validação](../docs/validation.md) e [decisões de frontend](../docs/architecture/frontend-v1.md).

Limites: tema claro, sem notificações, upload, recuperação de senha, SSR ou colaboração em tempo real. O tour é aberto em “Conheça a plataforma”; a conclusão é persistida para usuários autenticados. Os controles de seguir/deixar de seguir pessoas são explícitos porque a API atual não retorna a relação pessoal no perfil público. Acessibilidade usa semântica, foco e alternativa por formulário/lista ao canvas; não representa certificação WCAG nem teste com todas as tecnologias assistivas.
