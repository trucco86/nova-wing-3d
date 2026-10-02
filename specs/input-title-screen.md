# Entrada de tiro e capa simplificada

- Durante a missão, teclas mapeadas consomem keydown e keyup, inclusive repetição; Space não ativa um botão de interface que ficou focado. Combinações Ctrl/Meta/Alt permanecem do navegador e não disparam ações do jogo.
- Início transfere foco ao canvas. Cancelamento/perda de foco continua liberando controles.
- Textos e imagens do jogo não oferecem seleção/callout nativo. Touchstart/move não passivos protegem canvas e controles de jogo; controles de áudio/pausa continuam clicáveis. Contextmenu/seleção durante combate são cancelados na captura, incluindo HUD.
- Capa exibe apenas marca Five Cats, título Nova Wing, frase curta, iniciar/continuar e ajuda recolhida. HUD de combate completamente oculto. Nave 3D é a composição visual principal.
- Layout verificável em desktop, celular horizontal e retrato; botão de início dentro do viewport e sem sobreposição com ajuda. Fallback WebGL permanece legível.
- Testes cobrem teclado com botão focado, pressão longa e seleção em HUD, ajuda e capturas da capa. Gestos reservados ao sistema operacional/Safari precisam de validação em aparelho real; não prometer bloquear UI fora da página.

## Organização e documentação

A proteção de entrada vive em `src/input.js` e aparece no mapa de contexto. O README apresenta apenas mecânicas atuais, com controles de teclado/toque, módulos e fluxo de entrega. `docs/REPOSITORIO.md` explica onde editar; `specs/README.md` vincula contratos e testes; o harness distingue instruções, gates executáveis, CI e limites de avaliação. A estrutura preserva caminhos de build e testes, sem reescrever a engine.
