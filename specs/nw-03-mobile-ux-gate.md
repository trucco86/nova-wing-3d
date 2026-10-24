# NW-03 — Gate de UX mobile e impacto bloqueado (P0)

## Objetivo

Evitar a regressão da etiqueta amarela sobre a mira e colisões entre HUD,
RPG, combate orbital e botões no modo touch. Este gate complementa os
testes da v1.22; não altera balanceamento, saves ou jogo nativo.

## Critérios automatizados

- Executar Playwright com ponteiro touch e viewports 390×844 e 320×568.
- Nenhuma interseção entre HUD de chefe, RPG e ações touch.
- HUD de vida e pontuação não colidem quando ambos estão visíveis.
- Controles de órbita não encobrem as ações touch.
- As cinco ações principais são visíveis, ficam inteiras na tela, têm
  ao menos 60×60 pixels e não se interceptam.
- Impacto bloqueado real não exibe a antiga etiqueta amarela: fonte
  invisível, marcador até 24×24 pixels e captura por resolução.
- O teste falha se uma condição geométrica obrigatória deixar de valer.

## Gate humano para publicação

Revisar as capturas do SHA final: voo comum, alvo bloqueado, chefe,
órbita e painel RPG aberto/fechado. Em aparelho físico, validar Safari
iOS, Android Chrome, áreas seguras, gesto simultâneo, contraste e
legibilidade durante ação real. Um pipeline verde não substitui essa
homologação.

## Handoffs de qualidade

- UX: hierarquia da informação, oclusões, ergonomia e acessibilidade.
- Arquitetura: isolamento de mudanças web, preservação de estado e
  impactos sobre HTML gerado, performance e nativo.
- QA: cenários reproduzíveis, assertions e capturas por viewport.
- Release: CI no SHA final, revisão das evidências e publicação
  somente após autorização e critérios de aceite.

O protocolo descreve revisões especializadas e handoffs; não afirma
que exista orquestração autônoma de agentes em produção.
