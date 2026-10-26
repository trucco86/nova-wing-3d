# P0 — Botões ORBITAR no dock do polegar e radar sem sobreposição

## Problema funcional
Os botões de orbitar o chefe ficavam no meio do campo de combate e longe dos comandos da mão direita. A nave/inimigos podiam passar sob o controle; o radar ocupava área de outros elementos e do gameplay. A alteração de posição deve melhorar o **alcance e o toque reais**, não apenas aparência.

## Comportamento contratado
- Em mobile portrait (320×568 e 390×844) e landscape (844×390), ORBITAR esquerda/direita ficam na borda direita, imediatamente acima dos cinco comandos principais, com alvos físicos ≥ 60×60 px.
- O dock não interfere no joystick, TIRO, BOOST, BOMBA, GIRO, PODS, pause nem outros botões.
- O centro dos controles de órbita é efetivamente atingido pelo navegador (hit testing). Segurar esquerda/direita altera o ângulo de órbita contra o chefe.
- Radar da arena é pequeno e posicionado na faixa superior direita de informações, sem colisão com escudo, pontuação, câmera, RPG, barra do chefe ou controles.
- Nenhum overlay bloqueia toques no joystick ou no controle de nave/robô, nem invade a faixa central de jogo.
- Fora da arena de chefe, botões de órbita ocultos **não capturam toques**.
- Desktop continua com teclado J/L sem mudanças.

## Qualidade / publicação
- Playwright mobile em 320×568, 390×844 e 844×390 verifica geometria, alvos, elemento sob o dedo e direção de órbita sob toque sustentado; captura screenshots.
- CI completa, HTML gerado e preview em branch isolada; nenhum merge DEV/HML/PROD sem revisão em dispositivo físico, FPS e aceite.
