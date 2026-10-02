# ADR — primeira API funcional BreadCrumbs

Estado: implementado nesta etapa, após o pedido de criar a API com base no contexto completo. A restrição anterior a documentação/fundação foi ampliada por esse pedido. O frontend e a biblioteca visual continuam fora desta entrega.

## Persistência e fronteiras

Foi escolhido PostgreSQL com `pg`, SQL parametrizado e repositórios por domínio. Contas, sessões, colaboradores e interações têm chaves estrangeiras, unicidade e índices. O grafo autoral é um documento JSONB com revisão, validado no service. Essa combinação atende às relações de acesso/comunidade e à estrutura extensível dos nós sem vincular o schema a um renderer.

Uma alternativa seria normalizar cada nó e conexão em tabelas; facilitaria algumas consultas, mas aumentaria o custo inicial de operações de edição em lote. JSONB facilita salvar o documento inteiro, ao custo de regravar o grafo e serializar suas alterações. Não é a solução final para edição simultânea de grande escala. Prisma/TypeORM poderiam oferecer mapeamento e migrações; não foram adicionados porque o driver e repositórios pequenos cobrem o contrato atual sem outro modelo de entidade.

Migrações SQL são explícitas, versionadas e aplicadas com checksum, transação e advisory lock. Nunca há sincronização destrutiva de schema nem reset automático. A aplicação fecha o pool no shutdown. O health de processo é separado da prontidão do banco.

Módulos: `auth`, `users`, `roadmaps`, `progress`, `community`. Explorar consulta o domínio de roadmaps; onboarding integra o perfil. Não foram criados microserviços, CQRS, event bus, Redis ou módulos vazios.

## Identidade e e-mail

Sessões usam tokens opacos aleatórios de 256 bits, armazenados por SHA-256, com validade de sete dias e revogação no logout. Essa escolha atende à revogação imediata no monólito sem refresh token/JWT. Cada requisição protegida consulta a sessão e a confirmação da conta.

Senhas usam scrypt assíncrono com salt de 128 bits, saída de 64 bytes e parâmetros versionados (`N=32768`, `r=8`, `p=3`). Não são registradas em logs ou retornadas por repositórios de perfil. Confirmação usa token independente, também armazenado por hash, validade de 30 minutos e consumo único. Reenvio substitui o anterior. Endereços são normalizados; senha não é truncada ou normalizada silenciosamente.

SMTP usa Nodemailer. Mailpit captura mensagens localmente; produção exige configuração explícita e TLS validado. Envio é síncrono e não transacional com o banco: se falhar, a conta permanece pendente e a API retorna `503`; reenvio é o caminho de recuperação. Fila/outbox não foi apresentada como existente.

Todas as rotas são protegidas por padrão; exceções públicas são explícitas. Limites por IP/rota usam Throttler em memória. Nginx substitui `X-Forwarded-For`; Compose confia em um proxy, enquanto execução nativa ignora esses cabeçalhos por padrão. Múltiplas réplicas exigirão armazenamento compartilhado para limitação de chamadas.

## Escolhas iniciais de produto

As regras abaixo resolvem questões abertas do brief para tornar esta versão executável. São escolhas documentadas desta implementação, não requisitos originalmente detalhados pelo usuário.

| Questão                | Regra inicial implementada                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelo do grafo        | Ramificações, componentes desconectados e ciclos entre nós distintos. Sem autorrelacionamento; conexões não impõem pré-requisitos.                                    |
| Salvar e colaborar     | Substituição atômica do grafo, com `expectedRevision`; conflito retorna 409. Colaboração assíncrona, sem edição em tempo real.                                        |
| Tipos de nós           | Identificador extensível, posição, descrição, recursos, cor/forma opcionais e obrigatoriedade. Sem catálogo fechado.                                                  |
| Limites                | 1 MiB por JSON, 1.000 nós, 3.000 conexões, 30 recursos/nó. Limites operacionais iniciais, não benchmark do editor.                                                    |
| Progresso              | Individual por usuário e nó. Contar obrigatórios; na ausência deles, todos. Peso igual, grafo vazio 0%. Remoção de nó apaga seu progresso.                            |
| Compartilhar           | Proprietário gerencia papéis de usuários já confirmados, identificados por UUID. Sem convites externos ou transferência de propriedade.                               |
| Publicar               | Privado/público; publicar expõe o estado corrente, sem snapshot de rascunho separado. Apenas proprietário publica.                                                    |
| Comentários            | Comentador/editor/proprietário podem comentar. Usuário externo autenticado pode comentar em público; papel explícito de visualizador não pode. Um nível de respostas. |
| Exclusão de comentário | Autor ou proprietário; respostas removidas junto com o comentário principal.                                                                                          |
| Interações             | Like/favorite/follow idempotentes. Favoritos pessoais não expostos a outros usuários. Seguir não cria cópia nem sincronização de versões.                             |
| Descoberta             | Busca full-text pública; popularidade por curtidas/seguidores; em alta por essas interações nos últimos sete dias. Sem personalização.                                |
| Perfil                 | Nome/bio e contagens públicos para contas confirmadas; e-mail e onboarding restritos ao próprio usuário.                                                              |
| Onboarding             | Gravar primeira conclusão de forma idempotente; pular/retomar não são tratados como conclusão automática.                                                             |

Conteúdo é texto simples. URLs são validadas como HTTP/HTTPS, sem baixar conteúdo remoto. A interface futura deve renderizar texto com escaping e não inserir esses campos como HTML.

## Consistência e autorização

O proprietário é uma coluna do roadmap, não um papel alterável pela entrada do usuário. Mutações de grafo, permissões, publicação, progresso e comunidade travam primeiro a mesma linha do roadmap e verificam a autorização dentro da transação. Isso evita salvar com uma permissão já revogada ou gravar progresso para um nó removido simultaneamente.

Consultas públicas filtram visibilidade no SQL. Leitura privada sem relação retorna 404. Alterar uma URL ou enviar um `userId` adicional não permite alterar o progresso de outra pessoa: o estudante é sempre obtido da sessão. DTOs rejeitam campos desconhecidos; UUIDs dos nós são canonicalizados antes da validação de duplicidade e referências.

Atualização parcial preserva campos omitidos. DTOs de resposta e consultas com colunas explícitas mantêm credenciais fora das respostas. Persistência é independente de Foblex, ngx-vflow ou Rete; nenhuma biblioteca de editor foi instalada.

## Contratos e validação

Swagger deriva das classes e controllers; OpenAPI é exportado sem conexão obrigatória com PostgreSQL. Postman é regenerado do contrato, sem faker aleatório. A suíte HTTP usa PostgreSQL real em schema exclusivo, com migrações idempotentes e limpeza das próprias fixtures. Há um smoke separado pelo Nginx com SMTP real capturado no Mailpit.

A [documentação da API](../../API/README.md) contém operações, exemplos e limites. Os resultados efetivamente executados estão em [validação](../validation.md).

## Fontes consultadas

- [node-postgres: transações](https://node-postgres.com/features/transactions): uma conexão por transação, com liberação após commit/rollback.
- [Node.js: crypto](https://nodejs.org/api/crypto.html): primitivas de tokens, hashing e scrypt.
- [NestJS: rate limiting](https://docs.nestjs.com/security/rate-limiting): guards e limites por rota.
- [Nodemailer: SMTP](https://nodemailer.com/smtp): transporte e configuração TLS.
- [Mailpit: API](https://mailpit.axllent.org/docs/api-v1/): verificação local das mensagens no smoke.

As skills existentes foram reavaliadas; `nestjs-best-practices` orientou módulos, repositórios, validação e transações. Nenhuma skill adicional foi necessária para esta etapa. Banco, SMTP e sessões foram escolhidos pelo escopo do produto, sem adoção automática de uma stack de autenticação encontrada em catálogo.
