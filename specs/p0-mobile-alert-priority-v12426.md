# P0 — Arbitragem de avisos no HUD mobile (v1.24.26 candidata)

## Problema
O trilho de comunicação superior tem altura fixa (38px em 320px portrait).
Quando vida crítica, ataque iminente, escudo baixo, aproximação do chefe,
item coletado e rádio ficam simultaneamente visíveis, os últimos avisos podem
ser cortados por `overflow: hidden`. Uma emergência real não pode disputar
espaço com mensagens rotineiras nem invadir a área central de mira.

## Solução
Apenas durante missão em dispositivos com ponteiro coarse, a apresentação
obedece à seguinte prioridade:

1. Integridade crítica (vermelho);
2. Ataque iminente (vermelho, excluindo avisos marcados como `info`);
3. Escudo baixo (amarelo);
4. Aproximação do chefe (amarelo);
5. Informações, coleta e rádio.

As mensagens inferiores são **ocultadas apenas visualmente**, sem eliminar
seu estado, alterar controles de voo ou disparar efeitos colaterais. Quando a
prioridade superior desaparece, o próximo aviso volta automaticamente.
A política não altera a interface desktop.

## Testes de aceite
- Chromium touch em **320×568, 390×844 e 844×390** com combate real contra chefe.
- Simular simultaneamente seis avisos para confirmar a precedência
  vermelho > amarelo > informativo.
- Checar que aviso crítico fica dentro do trilho superior (sem clipping)
  e não atravessa a linha central da tela.
- Confirmar que TIRO, BOOST, BOMBA e ROBÔ permanecem alcançáveis por
  `document.elementFromPoint` durante alertas.
- Capturar evidências visuais em cada viewport.
- Validar versão, build reproduzível, lint, testes unitários e Playwright;
  manter release isolada em PR, sem deploy HML/produção automático.

## Revisão humana
Inspecionar em Safari iPhone e Chrome Android com áudio, vibração e animação
real; considerar duração dos alertas e legibilidade à luz do dia. A CI
aprovada não equivale à homologação de experiência em aparelho físico.
