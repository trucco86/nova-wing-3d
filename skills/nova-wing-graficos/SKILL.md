---
name: nova-wing-graficos
description: Alterar gráficos, shaders, modelos, cenário ou pós-processamento do Nova Wing 3D. Use para mudanças visuais ou de desempenho de renderização.
---

# nova-wing-graficos

## Contexto

Leia src/bosses.js, src/visuals.js, src/styles.css e docs/ARQUITETURA.md. Preserve geometria compartilhada, instâncias e fallback de WebGL. Não copie modelos proprietários.

## Procedimento

1. Localize a especificação e registre critérios observáveis antes de alterar comportamento.
2. Faça uma mudança limitada ao objetivo; atualize explicações quando os contratos mudarem.
3. Verifique malhas finitas e índices válidos em tests/graphics.test.mjs. Execute testes no navegador, capture desktop e mobile e revise contraste e enquadramento. Não alegue FPS sem medir dispositivo e resolução.
4. Execute os gates de AGENTS.md. Não remova testes para mascarar falha; diagnostique a causa.
5. Entregue resumo, evidências executadas e limitações. Publicações seguem a autorização existente do usuário.

## Conclusão verificável

O diff deve corresponder ao pedido, os gates pertinentes devem passar e qualquer validação indisponível deve permanecer explicitamente pendente. Não invente evidências nem reproduza funcionalidades inexistentes do projeto de referência.
