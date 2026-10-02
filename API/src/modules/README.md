# Módulos de domínio

- `auth`: cadastro, e-mail, sessões, guard global e rotas públicas explícitas.
- `users`: perfis, onboarding e relações entre usuários.
- `roadmaps`: metadados, grafos, visibilidade, membros e consultas Explorar.
- `progress`: estado individual de estudo e cálculo de conclusão.
- `community`: comentários, respostas e reações em roadmaps.

Controllers delegam aos services; repositories concentram SQL parametrizado. `RoadmapsService.withAccess` fornece a transação e autorização sob lock para alterações associadas ao roadmap. Detalhes em `docs/architecture/api-v1.md` na raiz.
