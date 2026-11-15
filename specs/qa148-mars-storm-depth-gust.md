# QA148 | Marte: tempestade com profundidade e rajadas, sem novos draws

## Problema

A tempestade atual é percebida como três bancos translúcidos de areia quase imóveis em profundidade. O usuário pediu visual mais expressivo sem prejudicar o desempenho mobile (baseline fase 1 High: 34 FPS, p95 39 ms, 1.385 draws).

## Comportamento observável

- Antes do evento e após seu fim, o sistema de tempestade não desenha efeitos nem modifica hitboxes.
- Durante a tempestade, as três camadas de névoa já existentes se deslocam em x/y/z, inclinam e variam em escala conforme rajadas determinísticas.
- O campo de partículas acompanha a rajada. Não se criam meshes, novas partículas, materiais ou texturas por frame.
- Ao retornar ao mesmo segundo do jogo, cada camada volta exatamente à posição, inclinação, escala e opacidade daquele instante (pausa, replay, reset).
- Objetos meteorológicos são visuais apenas, no mundo 3D; não ocupam o HUD ou controles do RPG.
- A visibilidade do piloto segue o modelo de risco existente; não alterar física, timers de fase, tempestade ou boss.

## Gates

- Teste Node com replay determinístico, clone, início/meio/fim e limite de recursos.
- Quality + quatro shards Playwright no SHA final e comparação visual no preview.
- Perfil High e Medium em celular real, comparar 35s com baseline sem misturar fases.
- Não fazer merge/deploy antes do CI completo e verificação visual.
