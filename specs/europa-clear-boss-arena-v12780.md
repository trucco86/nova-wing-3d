# Europa / fase 6 — arena glacial ampla e sem clipping (1.27.80 QA)

## Problemas observados
- O Colossus utiliza a altitude do centro de um chefe aéreo (cerca de 12 unidades), mas seus pés, garras e chassis 3D se estendem muito abaixo da origem. Ao atacar, parte do modelo atravessa o plano de gelo fixado em y=-7.
- Sessenta cristais do corredor, além de elementos do cenário próximo, continuam se deslocando no mundo durante o combate. Eles podem surgir entre câmera, mira, boss, armas e pontos fracos. A limpeza anterior removia apenas os obstáculos com colisão, não os objetos visuais.

## Solução
1. Medir uma vez na criação da luta o bounding box 3D do Colossus e calcular a altitude mínima do centro que deixa **12 unidades de margem** sobre o gelo. Aplicar o mesmo limite a cada fase do movimento (entrada, windup, attack, recovery, 360°).
2. Agrupar os sessenta cristais dinâmicos de Europa em `europa-near-field-crystals`, desativando apenas esse grupo na luta. Não remover nem modificar elementos visuais da aproximação.
3. Mover a vegetação glacial/landmarks e a vida ambiente de segunda/terceira camada **280 unidades para trás** no início da arena, mantendo identidade visual e sensação de escala, sem volumes altos no primeiro plano.
4. Ocultar a nave-mãe genérica apenas na arena de Europa e evitar que atualizações de chegada reabilitem cristais durante a luta.
5. Observar a fase 6 apenas (`sectorIndex===5`). Saturno/fase 8, fase 4, demais mundos, mecânicas dos chefes e controles permanecem intactos.

## Critérios de aceite
- Para todos os estados e fases de ataque, bounding box de Colossus não intersecta o plano y=-7. Seus hardpoints, HP, posição relativa dos geradores e armas não mudam.
- `europaArena.active=true`, `foregroundHidden=true`, `carrierHidden=true` e `backdropDepth=-280` desde o surgimento do chefe.
- Cristais dinâmicos e obstáculos com colisão não entram no corredor de tiro; 360° de órbita mantém a visão do boss e radar.
- A chegada não reativa os cristais; sair da luta/resetar restaura as propriedades e a aproximação normal.
- Playwright mobile 390×844 e 844×390, captura de tela, sem erros de página.
- Fases 1/2 previamente aprovadas e Stage 4/8 não mudam.
- Testes em iPhone físico com gráfico Alto/Médio e revisão visual antes de qualquer merge em produção.
