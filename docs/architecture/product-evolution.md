# Implicações arquiteturais do produto

**Registro da etapa de contexto.** A implementação posterior da API e as decisões que substituem propostas deste documento estão em [API v1](api-v1.md).

Este documento complementa as [decisões da fundação](decisions.md) à luz do [contexto oficial BreadCrumbs](../product/README.md). Descreve propostas de evolução, não módulos ou contratos já implementados. A etapa atual continua restrita à fundação e documentação.

## Manter a base modular

O monólito modular NestJS e o Angular organizado por feature atendem à evolução incremental prevista. O fluxo controller → service → repository mantém regras nos services e persistência isolada. Criar módulos, repositórios e DTOs somente quando uma funcionalidade concreta precisar deles; não abrir dezenas de pastas vazias com base na visão global.

Possíveis fronteiras futuras:

| Responsabilidade    | Dados e comportamento a manter coesos                                      |
| ------------------- | -------------------------------------------------------------------------- |
| Identidade e acesso | Conta, confirmação de e-mail, autenticação e sessões.                      |
| Roadmaps            | Estrutura autoral, nós, conexões, recursos, metadados e publicação.        |
| Compartilhamento    | Relações de acesso e políticas por roadmap, em colaboração com identidade. |
| Estudos e progresso | Acompanhamento de aprendizado, após definição de titularidade e cálculo.   |
| Comunidade          | Interações e perfis públicos, conforme a priorização de produto.           |
| Descoberta          | Consultas para Explorar, busca, categorias e ordenação.                    |
| Onboarding          | Registro de conclusão e experiência guiada do usuário.                     |

Essas fronteiras são candidatas, não nomes obrigatórios de módulos ou justificativa para microserviços. Banco, ORM, fila, cache, mecanismo de busca e store global continuam sem escolha.

## Separar o grafo da biblioteca visual

Propõe-se um modelo de documento do roadmap independente do renderer: identidade estável dos nós, conexões entre identidades, conteúdo e apresentação documentados. Posição e estilo podem precisar de persistência, mas viewport, seleção e gestos são estados de interação separados. A distinção evita que uma troca de biblioteca determine o modelo de negócio.

O contrato futuro deve permitir ramificações e componentes desconectados. Não impor uma lista, uma única raiz ou ausência de ciclos sem decisão explícita do produto. Extensão de tipos de nós não implica aceitar dados arbitrários sem validação.

Na etapa do editor, criar um adaptador entre o modelo da aplicação e a biblioteca escolhida. Validar integridade das referências e limites de conteúdo também no backend. Salvar e reabrir um documento deve preservar estrutura e apresentação previstas pelo contrato. Não persistir indiscriminadamente objetos internos da biblioteca nem criar schemas agora. A seleção depende da [comparação e prova de conceito futura](graph-editor-options.md).

## Distinguir autoria, estudo e colaboração

É recomendável separar a estrutura produzida pelo autor do estado de aprendizado de quem usa a trilha. Isso permite discutir estudo individual ou coletivo sem gravar conclusões diretamente na definição pública do conteúdo. A decisão de quem possui esse progresso e como ele é calculado continua aberta.

“Seguir”, “salvar”, “copiar” e “estudar” não devem virar a mesma relação por conveniência técnica. Publicação, versões e mudanças durante o estudo precisam de regras antes dos contratos. Colaboração não implica automaticamente WebSocket, CRDT ou edição simultânea: o brief não determina a modalidade. Controle de concorrência e histórico serão avaliados conforme essa definição.

## Permissões e visibilidade

O backend deverá avaliar cada ação e recurso, considerando identidade, relação com o roadmap e política vigente. Guards de frontend ajudam a experiência; não protegem o recurso. A verificação não pode se limitar a esconder botões ou confiar no identificador recebido do cliente.

Visibilidade pública e papel de colaborador são dimensões distintas: publicar não concede edição. Proprietário, editor, comentador e visualizador orientam uma futura matriz de capacidades, ainda a detalhar. Consultas de busca, listagens, recursos associados e contagens também precisam respeitar visibilidade. As opções público, por link e privado aparecem no guia visual, mas os detalhes de acesso por link precisam ser definidos antes da implementação.

## Conta e primeiro acesso

O requisito confirmado é confirmar e-mail antes do acesso à plataforma. Quando a etapa de identidade for solicitada, definir sessão, reenvio, expiração, uso único e validação segura dos tokens, tratamento de abuso e provedor de envio. Não há escolha de JWT, autenticação terceirizada ou biblioteca de contas nesta etapa.

O onboarding deve registrar conclusão e evitar reapresentação automática. Propõe-se persistir essa informação vinculada à conta para funcionar entre dispositivos, em vez de depender exclusivamente de estado local do navegador. Pular, retomar, concluir e uma eventual versão do tour precisam de regras próprias. [Driver.js](https://driverjs.com/) é apenas candidato à camada de apresentação, sem dependência adicionada.

## Comunidade e descoberta em etapas

Como proposta de sequência técnica, a modelagem de autoria, visibilidade e publicação deve preceder métricas de popularidade e recomendações. Busca e Explorar poderão começar com consultas compatíveis com o banco escolhido, quando houver requisitos e dados; não há necessidade demonstrada de indexador externo agora.

Favoritos, comentários, seguidores e demais interações devem ser introduzidos com regras explícitas, sem transformar exemplos de mockups em escopo obrigatório. Moderação, permissões e impacto em contagens precisam acompanhar a funcionalidade correspondente. Esta sequência não é um cronograma aprovado nem define o MVP.

## Frontend e critérios de evolução

Manter standalone, lazy loading e organização por feature. Separar estado da API, estado local do editor e preferências de apresentação. Extrair componentes compartilhados quando houver uso real e aplicar o [guia visual](../design/README.md); não adicionar um UI kit que imponha outra identidade.

Cada etapa relevante deve especificar comportamento observável, acessibilidade, responsividade, erros e permissões antes de fechar contratos. Alterações HTTP devem atualizar OpenAPI e a collection Postman pelo fluxo existente. Testes devem acompanhar os riscos reais introduzidos, incluindo autorização e integridade do grafo quando essas regras existirem.
