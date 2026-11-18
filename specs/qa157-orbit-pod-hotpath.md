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

## Evidências de validação

- CI full no SHA `d1b2de07d8894433e65b9b1cc090681af0641659`: workflow [44276178814](https://github.com/trucco86/nova-wing-3d/actions/runs/44276178814), quality e os seis Playwright shards aprovados, com o gate agregado `browser` verde.
- O run acima foi iniciado por `workflow_dispatch` após geração automática do HTML. Os runs de evento `pull_request` disparados pelo bot ficaram em `action_required`; a validação associada a este commit documental deve confirmar os checks da própria PR antes de qualquer merge.
- Não existe evidência de ganho de FPS em dispositivo físico; a melhoria confirmada é a remoção de alocações temporárias no código.

## Versão de publicação

- O gate de invariantes identificou corretamente que a alteração do HTML distribuído exige uma versão posterior à `1.27.150`.
- A sincronização da branch preparou a candidata `v1.27.151` no commit `9301e46fdd0ef3aed5fd8e478e6a7ab8130e5765`, alinhando `package.json`, lockfile, projeto iOS, changelog, notas e HTML.
- A CI de `v1.27.151` deve passar no SHA final da PR com evento `pull_request`. O sucesso da CI antiga de `1.27.150` não autoriza esta publicação.
