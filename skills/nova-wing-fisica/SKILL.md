---
name: nova-wing-fisica
description: Alterar movimento, colisões, aceleração ou integração temporal do Nova Wing 3D.
---

# nova-wing-fisica

## Contexto

Leia atualização e entradas em src/game.js. Registre unidades e limites. Preserve teclado e toque, liberação por blur e pointercancel.

## Procedimento

1. Localize a especificação e registre critérios observáveis antes de alterar comportamento.
2. Faça uma mudança limitada ao objetivo; atualize explicações quando os contratos mudarem.
3. Compare cenários com deltas diferentes dentro de tolerância justificada. Teste limites espaciais, pausa, energia e ausência de valores não finitos. Não converta movimento para dependência de frames.
4. Execute os gates de AGENTS.md. Não remova testes para mascarar falha; diagnostique a causa.
5. Entregue resumo, evidências executadas e limitações. Publicações seguem a autorização existente do usuário.

## Conclusão verificável

O diff deve corresponder ao pedido, os gates pertinentes devem passar e qualquer validação indisponível deve permanecer explicitamente pendente. Não invente evidências nem reproduza funcionalidades inexistentes do projeto de referência.
