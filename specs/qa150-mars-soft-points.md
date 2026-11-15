# QA150 | Poeira marciana sem quadrados sólidos

## Evidência visual
Captura do Playwright da QA148, workflow 43760246846, browser-evidence-4,
arquivo `mars-07-midstage-sandstorm-crosswind.png`.
A tempestade aparece composta por numerosos quadrados amarelos de bordas
rígidas, por uso de PointsMaterial com pontos de tamanho 5 sem alpha map.

## Contrato
- Manter uma única Points mesh com 240 partículas e três planos de névoa.
- Suavizar bordas dos sprites por alpha radial em `gl_PointCoord` no shader.
- Não adicionar textura, mesh, luz, draw call, collider, partículas ou geometria.
- Material de cada nuvem independente; program cache key estável.
- Não alterar tempo de tempestade, vento, radar, RPG nem custo CPU por frame.
- O shader trabalha no render e não é recompilado por frame.
- Testar em WebGL/Safari real e Firefox/Chromium no gate navegador;
  verificar screenshots de antes e depois no mesmo instante da fase 2.

## Aceitação
Corrigir a leitura de quadrados duros na imagem do pico da tempestade,
preservando visibilidade da mira e do jogador. P95 frame time em celular
não deve piorar significativamente contra QA148. A CI não substitui
a inspeção humana das imagens.
