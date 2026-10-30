# Cinemática v1.27.25 — correção do relógio (QA)

## Defeito verificado

Em PR #173, CI 41044611906 falhou no desktop e mobile: o teste esperava BIA após 8 s da narrativa e permaneceu em NARRADOR. O laço WebGL limita o delta a 35 ms, inclusive durante a abertura; em renderização lenta, o tempo da narrativa fica em câmera lenta.

## Contrato

- Durante a cinemática, usar o delta de tempo real entre frames com teto de 1 s. A física normal de voo mantém 35 ms, sem descontinuidade em colisões.
- Preservar a pausa quando o app perde foco, tecla/touch de pular, retratos sincronizados e a ordem das falas.
- Não alterar login, ranking, save, conteúdo de combate ou ambientes implantados.

## Validação obrigatória

- Reexecutar o teste já existente `tests/browser/five-cats-cinematic-v12725.spec.mjs` no desktop e mobile. Não afrouxar timeout nem simular o resultado.
- `npm run build:check`, `npm run validate`, todos os 4 shards de Playwright e screenshots reais; aprovação humana antes de qualquer promoção.
- Correção aplicada apenas à candidata QA 1.27.25; produção, HML e DEV oficial permanecem isolados.
