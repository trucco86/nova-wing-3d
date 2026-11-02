# QA P0 — frame pacing + render budget p95 por aparelho (02/11/2026)

## Por que esta revisão
O diagnóstico anterior apresentava o custo **apenas do último frame** depois da pausa; um snapshot isolado não representa a experiência em dez fases e em Boss 360°. Esta revisão guarda um buffer circular de até 3.600 amostras **somente após o usuário iniciar a medição**.

## Uso (sem dados enviados)
1. Abrir QA; selecionar fase e perfil em **Opções → Gráficos**: **Alto** ou **Médio**.
2. Pausar → **FPS / Desempenho** → **Iniciar medição**; continuar voo/combate por **30–60 segundos**; pausar → **Encerrar** → **Copiar relatório**.
3. Repetir a mesma fase, comportamento e duração no outro perfil. Fazer cidade, Marte, corredor/núcleo da fase 4, e um chefe da segunda metade; registrar orientação retrato e paisagem.
4. Comparar FPS médio, p95 de intervalo de quadros, quadros acima de 33/50 ms, **chamadas de cena p95/pico**, **triângulos p95/pico** e **passes de pós-processamento pico**. Identificar adaptações automáticas de resolução/qualidade. O contador de draw calls é do render da cena, não de toda a pós-produção.

## Limitações honestas e gate
- Os contadores 3D são de `WebGLRenderer.info.render`, não **tempo real de GPU**. Um notebook emulado no CI **não substitui iPhone/Android**. Zero amostras não representa bom desempenho.
- Sem telemetria remota, impressão digital, gravação persistente, nem custo adicional de chamadas WebGL por frame. A exportação só ocorre mediante toque explícito em **Copiar**.
- Não alegar um alvo medido (30/60 FPS) sem um relatório do dispositivo e um baseline de versão anterior. A regra inicial de regressão é não aumentar o **p95 de tempo de frame em mais de 10%** versus o baseline equivalente por dispositivo/modo.
- Não publicar a candidata só porque 4 shards passaram. Exigir aceite humano de nave, chefes, HUD e fluidez em aparelho físico, ambas as qualidades, sem clip/oclusão.

## Escopo de código
`src/render-cost-audit.js`, `src/game.js`, testes Node isolados, teste browser existente de pausa e FPS. Mantém produção e persistência sem alteração.
