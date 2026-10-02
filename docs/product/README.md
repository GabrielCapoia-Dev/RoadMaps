# BreadCrumbs — contexto oficial do produto

**Crie, compartilhe e siga trilhas de conhecimento**

BreadCrumbs é uma plataforma para organizar, compartilhar e acompanhar caminhos de aprendizado sobre qualquer assunto. Combina editor visual, estudos, descoberta de roadmaps públicos e comunidade. Pessoas com experiência ajudam outras a aprender com mais clareza, compartilhando caminhos, materiais e técnicas de estudo.

Este documento consolida o [brief oficial integral](brief-oficial.txt) recebido em 01/10/2026. As [três referências visuais](../design/README.md) são o guia oficial inicial da marca e da interface. O protótipo Roadmap_DBA é uma referência histórica secundária; não restringe o produto a tecnologia ou a uma trilha específica.

## Escopo desta etapa

**Atualização de implementação:** após este registro de contexto, o usuário solicitou a criação da API. O backend agora implementa os domínios descritos em [API v1](../architecture/api-v1.md). As regras inicialmente abertas que receberam escolhas técnicas estão explicitadas nessa decisão. Os parágrafos abaixo preservam o escopo da etapa documental original; não descrevem mais o estado atual do backend.

A etapa atual registra o contexto e mantém a fundação técnica. Docker, Compose, Nginx, NestJS, Angular, organização de diretórios, Swagger, OpenAPI, Postman e padrões básicos já estão preparados. A aplicação continua com uma página técnica e um health check, sem domínio implementado.

**A visão abaixo orienta etapas futuras; não autoriza implementá-las agora.** Cadastro, autenticação, confirmação de e-mail, roadmaps, editor, comunidade, comentários, seguidores, progresso, onboarding e busca estão fora da implementação atual. Também não foram criados banco, entidades, módulos fictícios ou telas de produto.

## Filosofia e experiência

Clareza, comunidade, evolução, colaboração, criatividade, acessibilidade e conexão entre conteúdos devem orientar as decisões. A ferramenta deve ajudar tanto quem ensina quanto quem aprende. A organização visual precisa tornar caminhos complexos compreensíveis sem exigir longas explicações.

Os temas são abertos: idiomas, matemática, fotografia, concursos, design, finanças pessoais e tecnologia são exemplos, não uma taxonomia fechada. Personalizar o conteúdo de um roadmap não deve descaracterizar a interface da plataforma.

## Visão funcional confirmada

| Área             | Experiência esperada                                                                                                                                       | Limite do que foi definido                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Roadmaps         | Criar e organizar grafos de nós e conexões, com ramificações, caminhos opcionais e estruturas independentes.                                               | Não assumir lista ordenada nem árvore obrigatória. Política de ciclos e significado das conexões ainda abertos.       |
| Editor           | Criar, editar, duplicar, excluir, mover e conectar nós; remover conexões; usar seleção, zoom e pan.                                                        | Prioridade desktop. Biblioteca e interação detalhada serão avaliadas em etapa própria.                                |
| Personalização   | Cores, formatos, estilos de nós e conexões, preservando a identidade da plataforma.                                                                        | Limites de personalização e catálogo inicial não definidos.                                                           |
| Conteúdo         | Títulos, descrições, observações, links, materiais, referências, obrigatoriedade e posição.                                                                | Módulo, tarefa, recurso, marco, objetivo e checkpoint são exemplos extensíveis, não um enum fechado.                  |
| Progresso        | Mostrar estados de conclusão, percentual e quantidades de etapas concluídas/restantes.                                                                     | Não iniciado, em andamento e concluído são exemplos do brief. Dono do progresso, pesos e cálculo ainda não definidos. |
| Compartilhamento | Permissões com responsabilidades de proprietário, editor, comentador e visualizador.                                                                       | Matriz de ações, convites, transferência e revogação precisam de definição.                                           |
| Publicação       | Permitir que o criador torne um roadmap público e disponível para descoberta.                                                                              | Publicidade, edição colaborativa e progresso são conceitos distintos. Versionamento da publicação está aberto.        |
| Explorar         | Descobrir roadmaps públicos, novidades, populares, em alta, categorias, temas, autores e recomendações.                                                    | Fórmulas de ranking e recomendação não definidas.                                                                     |
| Busca            | Encontrar roadmaps, temas, categorias, usuários e conteúdos, com futura filtragem e ordenação.                                                             | Mecanismo de busca e abrangência de cada consulta ainda abertos.                                                      |
| Conta            | Cadastro, envio de confirmação, validação do e-mail e acesso após confirmação.                                                                             | Provedor, sessões e política dos tokens não escolhidos.                                                               |
| Onboarding       | Tour no primeiro login, explicando navegação, editor, progresso, compartilhamento e comunidade; registrar conclusão para evitar reapresentação automática. | Driver.js é uma referência candidata. Regras de pular, retomar e reapresentar versões futuras não definidas.          |

Comunidade é parte central da proposta. Perfis públicos, seguir pessoas/roadmaps, curtidas, favoritos, comentários, discussões, atividade recente, contagens e criadores em destaque são mecanismos a priorizar. A lista não obriga a implementar todos no primeiro lançamento.

## Interface e qualidade

O tema inicial é claro. A linguagem visual é minimalista, sofisticada, colaborativa, modular e intuitiva, com bastante respiro, linhas arredondadas e hierarquia clara. O [guia visual](../design/README.md) registra a paleta e as referências de componentes.

Explorar, perfis, roadmap público, comunidade e notificações devem funcionar em desktop, tablet e celular. O editor prioriza desktop, sem dispensar um estudo de navegação e consumo em telas menores. Teclado, foco visível, semântica, labels, contraste e estados compreensíveis sem depender apenas de cor fazem parte da qualidade esperada.

## Decisões abertas antes das respectivas funcionalidades

| Tema                | Questões a resolver quando a etapa for solicitada                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grafo               | Permitir ciclos e conexões repetidas? Uma conexão é sequência, pré-requisito ou relação livre? Quais tipos e portas serão oferecidos?                                      |
| Estudo e progresso  | O progresso pertence ao estudante, à equipe ou ao roadmap? Como contar nós opcionais, recursos e caminhos alternativos? Alterações na trilha afetam conclusões anteriores? |
| Seguir e reutilizar | Seguir, salvar, estudar e copiar um roadmap são ações diferentes? Como novas versões chegam a quem já estuda?                                                              |
| Colaboração         | Haverá edição simultânea em tempo real ou colaboração assíncrona? Como tratar conflitos e histórico?                                                                       |
| Permissões          | Quem publica, convida, comenta, apaga ou transfere propriedade? Como funcionam links e acesso público sem conta?                                                           |
| Comunidade          | Quais interações entram primeiro? Quais regras de moderação, denúncia e visibilidade são necessárias?                                                                      |
| Descoberta          | O que define popularidade e “em alta”? Quais campos podem ser buscados? Como preservar restrições de acesso nos resultados?                                                |
| Identidade          | Qual mecanismo de login/sessão e provedor de e-mail? Quais regras de expiração, reenvio e uso único da confirmação?                                                        |
| Tour                | Pular equivale a concluir? Há retomada e acesso manual ao tutorial? Como tratar mudanças relevantes do tour?                                                               |
| Design              | Qual fonte licenciada e quais arquivos vetoriais oficiais? Quais medidas de espaçamento, raio, tipografia e breakpoints serão adotadas?                                    |
| Escala              | Qual volume representativo de nós, conexões, conteúdo e colaboradores deve orientar os testes?                                                                             |

Essas questões não bloqueiam a etapa documental. Devem ser resolvidas conforme cada funcionalidade for detalhada, sem converter suposições em requisitos silenciosamente.

## Continuidade técnica

A stack e os padrões existentes permanecem descritos no [README principal](../../README.md) e nas [decisões da fundação](../architecture/decisions.md). As [implicações arquiteturais](../architecture/product-evolution.md) são propostas para evolução incremental. A [comparação preliminar de editores](../architecture/graph-editor-options.md) registra alternativas sem adoção de dependências.
