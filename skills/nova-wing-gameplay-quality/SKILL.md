---
name: nova-wing-gameplay-quality
description: Pré-homologação comportamental do Nova Wing com evidências e aprovação humana.
---

# Gameplay Quality

Use em toda alteração de física, câmera, controle, combate, fase ou HUD. Leia [contrato do agente](../../docs/GAMEPLAY-QUALITY-AGENT.md), [spec](../../specs/gameplay-quality-agent.md), a skill de QA e a spec afetada.

1. Identifique cenário, comportamento esperado e regressões anteriores.
2. Execute os cenários Playwright afetados em desktop e mobile; registre SHA e resultados reais.
3. Revise capturas e telemetria. Separe defeito reproduzível, hipótese de design e limitação do ambiente.
4. Converta defeitos confirmados em testes de regressão sem enfraquecer as assertions existentes.
5. Entregue parecer ao jogador humano. Nunca trate ausência de achados como aprovação de gameplay ou autorização para produção.
