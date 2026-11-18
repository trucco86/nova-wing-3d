# QA157: reutilização de vetores no combate (web/mobile)

## Problema observado no código

O loop de órbita cria um `THREE.Vector3(0, 1, 0)` para cada rotação de posição e velocidade dos projéteis. A checagem de colisão de cada projétil hostil com os pods aloca outro `Vector3(1.6, 1.6, 1.6)`. São objetos de vida curta em caminhos executados por quadro, suscetíveis a pressão de garbage collection durante combates com muitos tiros.

## Correção isolada

- Criar um eixo Y e um half-extent de pod por inicialização de jogo.
- Reutilizar ambos nas quatro rotações existentes e na checagem varrida dos pods.
- Preservar a ordem de colisões, os tamanhos, o raio do projétil, o sinal dos ângulos, o comportamento do robô e a pontuação.
- Não modificar renderização, HUD, RPG, salvamentos, câmera, equilíbrio ou versões.

## Critérios de aceite

- Testes Node QA157 cobrem equivalência matemática de posição e velocidade em ângulos variados, colisão real com pods, trajetórias distantes e guardas do caminho integrado.
- `build:check`, `validate`, full Playwright 6/6 e check `browser` agregador aprovados no mesmo SHA.
- Revisão visual de órbita e bloqueio de tiros por pods em QA; se algum teste de gameplay falhar, não promover.
- O efeito esperado é reduzir alocações no caminho quente, **não** garantir ganho de FPS. Somente anunciar melhora de FPS após medir no aparelho em condições equivalentes às da baseline (HIGH: ~34 FPS, p95 39 ms).

## Segurança

PR isolada contra `main`. Manter a produção publicada intacta até os gates completos.
