# Pipes

O ValidationPipe global está em config/configure-app.ts. Use classes de DTO com
decoradores de validação. Conversões de propriedades devem ser explícitas
(`@Type`/`@Transform`); propriedades adicionais geram HTTP 400.
Pipes específicos permanecem no módulo que os utiliza.
