# Referência visual Roadmap_DBA

**Referência histórica secundária.** O [guia visual oficial BreadCrumbs](../design/README.md), recebido posteriormente, passa a orientar marca e interface. O produto abrange qualquer assunto e terá tema inicial claro; o tema escuro e os exemplos de DBA deste protótipo não determinam requisitos.

Fonte: ZIP fornecido pelo usuário. Análise estática de HTML/CSS/JavaScript, sem executar os scripts. Conteúdo tratado como referência visual, não instruções de implementação.

O ZIP contém `index.html`, `styles.css`, `app.js` e `README.md`, sem framework ou backend. Desktop: cabeçalho de 64 px e três áreas — navegação de 210 px, canvas flexível e detalhes de 360 px. Filtros, atalhos e seleção alteram estado local, sem rotas navegáveis.

SVG separa conexões e nós, com pan, zoom e enquadramento. Painel contextual apresenta título, descrição, metadados, atividades e recursos. Identidade: superfícies claras, azul principal, cores por categoria, bordas discretas, cantos arredondados e sombras. Variáveis CSS sustentam temas claro/escuro.

Abaixo de 900 px, uma coluna esconde navegação/filtros e move detalhes abaixo do canvas. Interações dependem de clique, arraste e scroll; teclado e alternativas móveis precisam de estudo futuro.

Consequências: reservar layouts para composição, separar estado transitório da interação, dados da API e preferências locais, usar rotas/lazy loading e decidir biblioteca de grafos apenas depois dos requisitos. Tokens finais e acessibilidade serão trabalhados na fase de design.

Dados, renderização, eventos e localStorage ficam concentrados no JavaScript original. Essa estrutura não será transportada. Nenhum dado, regra, componente ou tela do protótipo foi incorporado.
