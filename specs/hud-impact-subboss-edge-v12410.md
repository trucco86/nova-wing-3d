# P0 — Confirmação de impacto e HP do subchefe fora do centro

## Problema

A v1.24.9 concentrou avisos críticos na faixa superior. A auditoria de CSS e das capturas revelou mais duas mensagens de interface ainda na rota visual: o texto de confirmação de impacto na parte inferior, acima dos controles, e a barra de vida do subchefe numa faixa horizontal centralizada em celulares pequenos.

## Comportamento observável

- Qualquer rótulo de dano, acerto confirmado, ponto vulnerável ou tiro bloqueado fica na faixa superior `#hudNotices`, junto de mensagens e informações da missão. Não é permitido que uma label textual seja posicionada sobre o retículo ou acima dos botões mobile.
- O efeito de colisão do projétil e partículas permanece no **mundo 3D**, na posição real do contato; não alterar lógica de dano nem a duração de feedback.
- Na primeira fase e fases seguintes, HP do subchefe deve ocupar um pequeno cartão periférico direito, abaixo dos indicadores superiores, não uma barra atravessando a linha de tiro.
- Em 320×568, 390×844 e 844×390, o cartão deve ficar inteiramente dentro do viewport, na metade superior e à direita do eixo de combate, sem cobrir ações RPG.
- Quando chefe final e subchefe forem exibidos por breve transição, a barra do chefe final tem prioridade visual.
- Telas não-mobile preservam comportamento de barra horizontal superior existente. O minigame 2D e a pausa mantêm a lógica de ocultação.

## Regressão de QA

- Contrato real de impacto bloqueado no Playwright testa evento de colisão e bounding-box da confirmação superior.
- Teste mobile com 3 viewports gera capturas reais do subchefe e verifica borda direita, centro livre e colisão com RPG.
- Rodar `npm ci`, `npm run format`, `npm run build`, `npm run validate` e `npm run validate -- --browser` no commit final.
- Exigir aceite de legibilidade/UX em hardware real e FPS antes de HML/PROD. Sem merge ou promoção antecipados.
