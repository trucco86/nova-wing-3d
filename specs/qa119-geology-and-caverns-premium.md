# QA119 | Geologia premium: Marte, asteroides e Europa

## Contexto e objetivo
A QA118 foi aprovada na CI completa e forneceu a infraestrutura premium transversal das dez fases. Nesta iteração, elevar a fidelidade de **primeiro e segundo planos** de três ambientes com risco maior de geometria genérica, sem alterar campanhas, danos, hitboxes, câmera, chefe ou a sequência narrativa.

## Escopo entregue

### Fase 2: Marte
- Cinco mesas reais preservadas nas posições e deslocamento existentes, com corpo de nove lados, cinco níveis geométricos, escarpa deformada deterministicamente e normais recalculadas.
- Preservar 20 faixas sedimentares com cores naturais. Substituir 20 `Mesh` individuais por **cinco `InstancedMesh` de quatro faixas**, um por mesa. Reduz de aproximadamente 25 para 10 draw calls de mesas, sem novos shaders nem luzes.
- As escarpas continuam fora do corredor da nave; sem collider falso. Curiosity, Fobos/Deimos, Olympus e tempestades preservados.

### Fase 3: Asteroides
- Retirar os oito aros luminosos contínuos repetidos do interior da caverna. Substituir cada um por um lote de **oito veios minerais quebrados** apoiados nas paredes.
- Usar materiais de minério/rocha metálica fosca, resposta PBR às luzes do ambiente e cores geológicas discretas. Manter os mesmos quatro lotes por seção, mesmas dimensões físicas e região radial livre para nave e projéteis.
- Não tocar na geometria física dos obstáculos, na simulação de túnel, na entrada contínua nem na posição do subchefe.

### Fase 6: Europa
- Trocar as cristas altas em forma de cones por malhas com cinco faixas de rocha glacial, coloração geológica em vértices, faces deformadas e pontas fraturadas.
- Preservar **um único InstancedMesh de 26 cristas**, o outro lote das plataformas e o draw dos 84 flocos, sem novo colisores/draw calls.
- A superfície permanece fora da trajetória de voo, desaparece no túnel e na arena do Colosso e respeita os modos Médio/Alto.

## Regras de segurança
- Freeze quando pausa; reset e rolagem da superfície determinísticos.
- Geometria visual não é usada como obstáculo físico, sendo proibido alterar os limites/colisores aprovados sem PR específico.
- Não quebrar a QA117 de densidade inimiga nem a QA118 de dez fases.
- Sem publicação em produção, merge ou mudança de configurações de infraestrutura.

## Gate
1. QA119 unitário+integração, e regressões de Marte, asteroides e Europa (pausa, reset, chefe, túnel).
2. `npm run release:prepare -- 1.27.119`, `npm run format`, `npm run build`, `npm run validate`, quatro shards Playwright no mesmo SHA final.
3. Capturas comparativas no navegador real de Marte, interior do asteroide e superfície de Europa em desktop e mobile. Repetir QA114 estrito (menos de 3% de geometria incremental na cidade).
4. Medir draw calls, triângulos e p95 de quadro. Validar cenas visualmente em hardware mobile real antes de promoção.
5. A entrega desta rodada refina somente três fases; o restante da campanha premium continua herdando a QA118.
