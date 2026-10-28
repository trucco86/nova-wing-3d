# Radar de perigo dos chefes — candidato v1.27.13

## Contrato de gameplay

- A predição aparece somente durante **aviso** ou **execução do golpe físico**. O radar anterior de setores angulares permanece para salvas de projéteis, sem prometer zonas seguras irreais.
- O alvo do ataque é capturado no começo do aviso de 2,2 segundos; mover a nave **não desloca a área de impacto já anunciada**.
- Vermelho = área que a mesma função `bossMeleeHit` considera atingível, levando em conta a posição X/Y e a regra de flanco de Marvin; verde = posição real fora dessa área. O ponto branco/verde é a nave; o ponto vermelho indica a origem do ataque, com seta para a área de impacto.
- Se a nave estiver segura, o radar informa **SEGURO · MANTENHA**. Se estiver ameaçada, mostra a direção de uma posição de esquiva calculada por busca limitada contra a colisão real.
- Não há alteração de dano, IA, timing, velocidade ou hitboxes para facilitar artificialmente a vitória. Esquiva continua exigindo movimentação adequada.
- Todo o radar permanece na borda superior direita. Nenhum indicador extra é colocado sobre o centro do gameplay.

## Qualidade

Cobertura unitária de área de risco vs colisão, direções, segurança por flanco e ausência de falsas promessas contra salvas. Playwright verifica radar, esquiva real no browser, legibilidade e limites de tela portrait/landscape.

**Status:** candidata isolada, não homologada. Não promover para DEV/HML/PROD sem CI e validação humana.

## Verificação humana sugerida

1. Abrir o cenário do Marvin no menu Developer/QA, observar a mordida e mover a nave para fora do vermelho antes do contato.
2. Manter a nave na região segura e confirmar a ausência de dano físico; repetir com garras e tentáculos.
3. Verificar que o ponto de origem permanece distinguível e que a orientação funciona em retrato e paisagem.
4. Confirmar que as salvas de projéteis não exibem uma falsa zona verde de imunidade.
