# QA123 | Trailer de gameplay real do Nova Wing

Este pipeline grava a build exata da branch de captura com o motor Three.js/WebGL do jogo. A branch nasceu da QA122 Cidade 4.3, versão 1.27.122, sem promover código para DEV/HML/produção.

## Fonte da captura

- A fixture existente tests/dynamic-scene.js instancia createGame, do jogo real, com autoLoop desativado e renderer WebGL do próprio projeto.
- Frames PNG são capturados pelo Chromium depois de cada passo real da simulação. Não são imagens de banco, mockups ou vídeos de IA.
- Encontros com chefes usam o modo de teste/desenvolvedor do próprio projeto: são cenas do jogo, mas não uma partida humana contínua.
- A música é renderizada do código de composição original, via tests/audio-scene.js.
- A Cidade 4.3 é verificada contra Lua rachada visível e lotes urbanos ocupados. A captura falha se faltar conteúdo.
- A execução salva provenance.json com SHA, cenas, frames, métricas WebGL e duração.

## Execução

Na aba GitHub Actions, selecione QA123 | Nova Wing real gameplay trailer. A branch feat/qa123-real-gameplay-trailer-20261113 dispara o workflow por push e não altera a produção.

Quando a execução terminar com sucesso, baixe o artefato nova-wing-real-gameplay-trailer com sufixo SHA, que contém o MP4, a trilha e o manifesto.

Para reproduzir localmente na branch de captura, rode sucessivamente:

1. npm ci
2. npm run build
3. node tools/visual-fixture.mjs
4. npx playwright install chromium
5. NOVA_VISUAL_TEST=1 npm run dev (em outro terminal)
6. node trailer/capture.mjs

Vídeo de saída: artifacts/nova-wing-trailer/nova-wing-gameplay-real-preview.mp4

## Fidelidade e limites

Primeira prévia técnica: capturas nativas 1280x720 a 10 quadros/s, codificadas a 24 quadros/s com repetição de quadros. Não significa captura nativa de 1080p/60 FPS nem prova desempenho em GPU real. Nenhuma imagem gerada por IA ou footage externo é usado.

Antes de um trailer final premium: assistir à gravação, homologar cenas e fluidez, remover erros visuais e migrar a captura para executor com GPU ou hardware de gravação. Sem merge ou deploy automáticos. QA122 continua sujeita a homologação independente.
