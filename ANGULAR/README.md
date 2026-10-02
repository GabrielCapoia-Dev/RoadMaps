# Angular — fundação

Aplicação Angular 22 standalone e zoneless, gerada pela CLI oficial. Sem páginas de domínio. A única rota carrega a página técnica de ambiente por lazy loading; o botão verifica o contrato `GET /api/v1/health`.

## Executar

Preferencialmente use Docker conforme o [README principal](../README.md). Alternativa local:

```bash
npm ci
npm start
npm run build
npm run lint
npm test -- --watch=false
```

O servidor usa http://localhost:4200 e encaminha `/api` para http://127.0.0.1:3000 via `proxy.conf.json`. No Docker, a entrada pública é o Nginx em http://localhost:8080. O build vai para `dist/roadmap-web/browser`.

## Organização

- `core/http`: provider da URL relativa `/api/v1` e verificação técnica de saúde.
- `features/environment`: única página, exclusivamente para validar configuração.
- `features`: futuros fluxos do domínio, organizados por feature e carregados sob demanda.
- `layouts`: futuras composições de navegação.
- `shared`: futuros elementos realmente reutilizáveis.

Serviços e modelos específicos ficam junto de cada feature. Interceptors funcionais e guards só serão implementados quando existir necessidade; guards do navegador não substituem autorização no backend. Não há estado global, autenticação, biblioteca de grafos, SSR ou design system.

Testes Vitest validam navegação, URL HTTP configurável, contrato de saúde e estados da verificação. A página técnica é neutra e não reproduz o protótipo. A análise visual está em [docs/architecture/prototype.md](../docs/architecture/prototype.md).
