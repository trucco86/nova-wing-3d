# Setor 2 — Marte: aproximação, tempestade e fuga após os chefes

## Requisitos observáveis

- Phobos e Deimos permanecem visíveis em primeiro plano durante a aproximação ao disco de Marte, sem depender da renderização do terreno; desaparecem de modo progressivo ao descer na poeira da superfície.
- A tempestade avisa o jogador antes da chegada, reduz a visibilidade, causa vento lateral, inclinação e deslocamento na nave, e sinaliza explicitamente a turbulência na faixa de alerta existente. Rajadas severas causam dano limitado no escudo se o jogador não compensar com direção contrária, com cooldown para evitar perda súbita de vida.
- Ao terminar a tempestade de Marte, os canhões ficam obstruídos por areia. O usuário deve realizar exatamente três giros completos (Q/E/Z ou toque rápido no botão de giro), que também devem respeitar pausa e não contar repetição automática de tecla. Tiro primário/tiro carregado somente após a limpeza; resets zeram o contador. Feedback curto, fora do centro da mira.
- O Colosso das Dunas usa materiais ocre, ferrugem e arenito, evocando solo marciano; durante combate/colapso o centro da geometria respeita altitude mínima acima da superfície.
- Em todos os setores, depois da explosão do chefe, o jogador sai do setor em superpropulsão: BOOST aciona o salto após a explosão e, se não pressionado, a fuga acontece automaticamente no final da sequência. Não antecipar recompensa, tela de loja ou resultado da fase.
- Preservar controles, modo nativo, 10 chefes, progressão, áudio e performance WebGL.

## QA
- Testar fases de Marte em 0, 14, 23, 27 e 31 segundos para visibilidade lunar.
- Testar tempestade em 57, 61, 71, 83 e 85 segundos e contraposição à força do vento.
- Validar três giros, cooldown, reinício, pausa, toque e teclado; regressão de tiro carregado.
- Testar fim do chefe, sequência 4.7s de explosão, acionamento de BOOST e transição em 8s; verificar que a recompensa acontece uma vez.
- Executar CI Node, Playwright desktop/mobile, comparação visual no preview antes de publicar.
