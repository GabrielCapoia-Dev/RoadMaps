# Postman

`roadmaps.postman_collection.json` é gerada de OpenAPI pelo [conversor oficial Postman](https://github.com/postmanlabs/openapi-to-postman), em formato Collection v2.1, organizada por tags de domínio.

Importe e ajuste `baseUrl`, padrão `http://localhost:8080`. No modo nativo use `http://localhost:3000` ou o proxy Angular em 4200. Obtenha uma sessão pelo fluxo de [cadastro e confirmação](../../API/README.md) e preencha a autorização Bearer nas requisições protegidas. A collection não contém credenciais reais.

Regenerar com `npm run docs:generate`. UUIDs de geração são removidos, schema faker está desabilitado e exemplos determinísticos são fornecidos ao conversor em memória. Isso evita variações aleatórias de datas, UUIDs e números sem alterar o OpenAPI original. Os corpos que dependem de dados reais devem ser preenchidos conforme os schemas e exemplos do Swagger/guia. Cenários manuais adicionais devem ficar em collection complementar para não serem sobrescritos.

O conversor tem alertas transitivos registrados em [validação](../validation.md). Use somente com o contrato gerado pelo projeto; como alternativa, importe o OpenAPI diretamente no Postman.
