# Saturno 2.0 — Fase 8: batalha nos anéis de gelo

## Direção aprovada

- Saturno é o protagonista visual: planeta grande, faixas gasosas definidas, sombra sutil dos anéis, divisões e lacunas reais.
- A nave permanece no espaço: entrada direta com 8 segundos de orientação e nenhuma reentrada atmosférica artificial.
- A câmera mostra Saturno e a região de gelo; não repetir o horizonte da Terra, névoa marciana ou corredor de sucata.
- A frota inimiga protege o Couraçado Ômega, mas a fase é **travessia dos anéis**; naves avariadas não são o cenário principal.

## Gameplay

1. Orbitando Saturno: gelo fino lateral, planeta sempre visível.
2. Faixas de gelo em duas profundidades: movimento relativo e blocos faceteados; sem anéis artificiais atravessando o centro da tela.
3. Meteoros de gelo reais aparecem como obstáculos destruíveis com material próprio, colisão sólida e tiros bloqueados pela geometria.
4. Boss Couraçado Ômega: combate orbital livre, sem alteração da lógica da IA, pontos fracos ou recompensas.

## Regras técnicas

- Localização indexada 7; nenhum ajuste de timing nas demais fases.
- Céu/planeta/ring disk: apenas visual; fragmentos da profundidade são instanced e sem hitbox.
- Meteoros do corredor usam `createObstacle('ice-meteor')` e health própria, nunca colisões fantasmas.
- O efeito usa tempo de missão para que pausa/replay produzam o mesmo quadro.
- Não reutilizar as sete fragatas decorativas destruídas do perfil fleet; apenas inimigos e poucos couraçados coerentes.
- Perfil Médio oculta a camada alta de gelo; comparar p95 draw calls e FPS real.

## Verificação pendente

- Node e Playwright em desktop/mobile, teste QA direto na fase 8, preservação de Earth/Marte/Devastador.
- Capturas em 0, 8, 25 e 60 segundos, visibilidade real do planeta no celular e efeitos de profundidade.
- Medir 30–60s por preset e mesma rota, sem alegar FPS ou homologação visual antes dos dados físicos.
- Não promover em produção sem aceite da experiência.
