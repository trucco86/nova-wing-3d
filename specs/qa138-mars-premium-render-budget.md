# QA138: geologia premium com orçamento controlado

Objetivo: melhorar a presença visual da fase 2, sem aumentar o número de
draw calls, vértices, partículas, hitboxes ou texturas no render de Marte.

- Mesmo globo/rim, duas consultas noise3 e mesma geometria orbital.
- Cores sedimentares calculadas uma vez na montagem do plano do deserto.
- WeakMap mantém cache de chunks, planetas e tempestade sem interferir
  com clones do Three.js, reset, nem impedir coleta de lixo.
- Tempestade invisível não animará geometria nem uniformes.
- Testar clima, chegada a Marte, boss, tela mobile e reinício.
- Benchmarks reais: FPS, p95/p99, draws, triângulos e memória no mesmo dispositivo.

**Branch PR draft e preview isolado. Merge/deploy dependem de aprovação.**

## Comparação visual obrigatória

Usar o mesmo percurso e posição de câmera na versão-base QA137 e na candidata
QA138 para capturar: Marte em órbita, cratera e terminador, início do deserto,
tempestade em pico e chefe da fase 2. Registrar modo gráfico, resolução interna,
draw calls, p95 e p99 do tempo de quadro, triângulos e uso de memória antes e
depois. A contagem de objetos e partículas é preservada por contrato, mas o
shader ainda precisa ser avaliado em GPU móvel real. Se houver regressão,
priorizar reverter detalhe do fragment shader em vez de reduzir a jogabilidade.
