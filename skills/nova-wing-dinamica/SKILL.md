---
name: nova-wing-dinamica
description: Alterar combate, ondas, recursos, dificuldade, chefe ou transições da missão do Nova Wing 3D.
---

# nova-wing-dinamica

## Contexto

Leia src/game.js e tests/game.test.mjs. Especifique momento, recurso e transição alterados. Preserve o caminho comum de dano ao chefe para bombas e tiros.

## Procedimento

1. Localize a especificação e registre critérios observáveis antes de alterar comportamento.
2. Faça uma mudança limitada ao objetivo; atualize explicações quando os contratos mudarem.
3. Teste limites de bombas e escudo, cadência, invulnerabilidade, vitória, derrota e reinício conforme o risco. Use o harness real; não duplique a lógica para provar o comportamento.
4. Execute os gates de AGENTS.md. Não remova testes para mascarar falha; diagnostique a causa.
5. Entregue resumo, evidências executadas e limitações. Publicações seguem a autorização existente do usuário.

## Conclusão verificável

O diff deve corresponder ao pedido, os gates pertinentes devem passar e qualquer validação indisponível deve permanecer explicitamente pendente. Não invente evidências nem reproduza funcionalidades inexistentes do projeto de referência.
