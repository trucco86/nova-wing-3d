# Europa Combat 4.0 — Colosso glacial (vertical slice)

**Objetivo:** no setor 6 (índice 5), substituir a escolha de golpes genéricos por duas ações legíveis e esquiváveis.

- **Ice quake:** golpe que atinge uma faixa horizontal larga; o jogador deve subir ou descer. Reage a voo baixo e modo robô.
- **Cryo pincer:** braços pneumáticos se fecham sobre uma coluna vertical estreita; o jogador deve mover-se para o lado. Reage à altitude e alternância de ciclos.
- **Contrato:** o alvo é travado no windup existente de 2,2 segundos. O predicado `bossMeleeHit` determina dano e o radar exibe essa mesma região.
- **VFX:** preparação de impacto glacial ou pistões convergentes; três meshes e dois materiais, sem novas colisões e alocações por frame.
- **Não alterar:** fases 1–4, Devastador, Fênix, câmera, HUD e orçamento de projéteis.
- **Aceite:** testes Node, quatro shards Playwright, build reprodutível, inspeção desktop/mobile e FPS Alto/Médio.
