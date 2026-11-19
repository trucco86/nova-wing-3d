# QA160: redução de alocações das hitboxes do combate

## Diagnóstico
Durante cada disparo do jogador contra Marvin, pontos fracos dos chefes e casco do chefe,
o gameloop instanciava novos vetores contendo as mesmas dimensões de colisão.

## Contrato
- Criar três vetores de dimensões uma vez por jogo: 13/10/16 (rival), 5/5/5
  (pontos fracos), 45/20/4 (casco).
- Reusar os vetores em crossesSolid e impactPoint, que leem sem modificar os extents.
- Preservar volumes, pontos de impacto, dano, colisão, tiros, score, gameplay, HUD e controle.
- Testar movimentos que acertam, erram, partem do interior ou têm direção invertida.
- A versão QA160 herda a QA159 como PR empilhada, sem modificá-la retroativamente.

## Gates
- Release:prepare da v1.27.154 e HTML versionado sincronizado pelo workflow isolado.
- Testes Node completos, QA157, QA159, QA160 e seis Playwright browser shards.
- Preview e source repair no SHA final; revisar diff.
- Teste em aparelho físico de FPS, p95 e estabilidade pendente. Nenhuma promessa
  de melhora de FPS sem medição. Não fazer merge/deploy antes de revisão.
