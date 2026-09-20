---
name: nova-wing-audio
description: Alterar efeitos sonoros Web Audio do Nova Wing 3D. Use para sons de tiro, impacto, início e comportamento de áudio após interação.
---

# nova-wing-audio

## Contexto

Leia o trecho de áudio em src/game.js e a inicialização da missão. `src/audio.js` contém dez temas por setor e tema de chefe. O sequenciador acompanha a simulação; deve silenciar na pausa e descartar vozes ao mudar de faixa. Preserve desbloqueio por gesto do usuário.

## Procedimento

1. Localize a especificação e registre critérios observáveis antes de alterar comportamento.
2. Faça uma mudança limitada ao objetivo; atualize explicações quando os contratos mudarem.
3. Teste início repetido sem criar contextos de áudio extras. Confira pausa e retomada no navegador; o áudio simulado dos testes não comprova volume nem qualidade sonora.
4. Execute os gates de AGENTS.md. Não remova testes para mascarar falha; diagnostique a causa.
5. Entregue resumo, evidências executadas e limitações. Publicações seguem a autorização existente do usuário.

## Conclusão verificável

O diff deve corresponder ao pedido, os gates pertinentes devem passar e qualquer validação indisponível deve permanecer explicitamente pendente. Não invente evidências nem reproduza funcionalidades inexistentes do projeto de referência.
