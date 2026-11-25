# Política de esquiva de chefes

Primeiro componente de um jogador sintético reativo. Usa direção publicada no HUD do radar, ameaça e fase de aviso/ataque observada pela fixture. Converte as setas em teclas ou deslocamento do joystick; não consulta coordenadas ocultas do chefe nem modifica escudo ou física.

O agente mantém a posição quando está seguro. Sem direção específica, não inventa uma rota.

## Executor experimental

A mesma fixture de Rok e Colossus (Europa) é aberta separadamente para o perfil passivo e reativo, por até 30 segundos simulados. Desktop usa teclado e mobile usa joystick CDP. O executor coleta o HUD real a cada 0,25 segundo simulado, posições, escudo, comandos e janelas de ataque. Anexa JSON comparativo e screenshots finais ao Playwright. São quatro testes parametrizados e oito trajetórias potenciais.

```sh
node --test tests/gameplay-boss-dodge-policy.test.mjs tests/gameplay-boss-encounter-metrics.test.mjs
npm run test:browser -- gameplay-boss-reactive.spec.mjs
```

A comparação é consultiva. Se os tempos, escudo inicial ou exposição forem insuficientes, não calcular vantagem. Mesmo em janelas comparáveis, não inferir causalidade: sequências de ataques podem divergir em resposta ao comportamento. Não usar teleporte ou recuperação artificial de escudo. Não afirmar dificuldade justa, vitória, gameplay autônomo completo ou diversão. Não há gravação de clipe de combate nesta etapa.

Os testes e a execução real ainda precisam ser validados. Preservar a PR #447 e integrar posteriormente ao seu relatório e vídeo, após calibração.
