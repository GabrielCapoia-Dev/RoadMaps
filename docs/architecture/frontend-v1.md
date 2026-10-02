# Frontend BreadCrumbs — decisões de implementação

Etapa autorizada: construir o frontend Angular integrado à API, preservando o guia visual oficial. Angular 22 standalone, zoneless, signals, Signal Forms e rotas lazy. SCSS e tokens próprios mantêm a identidade; não adotar um kit visual que a substitua.

## Editor

A comparação em `graph-editor-options.md` foi retomada. Foblex Flow 19.3.0 foi adotado nesta implementação: integração Angular direta, licença MIT, nós HTML customizados, pan/zoom e interação de conexões. ngx-vflow permanece alternativa próxima; Rete adicionaria composição de plugins e integração Elements/Zone desnecessárias neste estágio. A escolha não implica superioridade de performance medida.

O componente de canvas recebe/produz o contrato Graph da API. Estado, revisões, validação, histórico local e permissões permanecem na aplicação. Operações por formulário/lista complementam arrastar. Build, navegador e persistência foram verificados; resultados em `docs/validation.md`. Não há promessa de edição simultânea ou benchmark de 1.000 nós.

## Visual e conteúdo

Paleta oficial, tipografia Manrope hospedada localmente (OFL), ícones vetoriais de traço consistente. O símbolo vetorial da interface é uma adaptação da referência raster, não um arquivo mestre oficial fornecido pelo usuário. Referências originais são preservadas.

Quando não houver roadmaps públicos, modelos de inspiração locais são identificados como exemplos, sem autores, curtidas ou métricas fictícias. Podem ser visualizados e usados como ponto de partida mediante criação de roadmap na conta. Eles não são inseridos silenciosamente na comunidade.

## Sessão e integração

Token Bearer guardado em sessionStorage para sobreviver ao reload da aba, nunca em URL ou logs. A API atual não oferece cookie HttpOnly; isso deve ser considerado em uma evolução de autenticação. Interceptor só anexa token a URLs da API na mesma origem. Guards ajudam a navegação e a autorização real continua no backend. Não renderizar conteúdo como HTML.

## Skills

`find-skills` consultou skills.sh e buscas `angular accessibility`/`frontend design`. A skill oficial `angular-developer` já instalada orienta a implementação. Avaliados frontend-design (Anthropic, cerca de 944 mil instalações e repositório com 179 mil estrelas na consulta) e accessibility (addyosmani, cerca de 57,8 mil instalações; avaliação anterior registrada). Popularidade não substitui verificação: o guia oficial da marca prevalece sobre sugestões genéricas, e contraste usa fontes W3C. Não foram instaladas coleções adicionais indiscriminadamente.

Fontes: [Angular](https://angular.dev/), [Foblex](https://flow.foblex.com/docs/get-started), [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [catálogo](https://skills.sh/).
