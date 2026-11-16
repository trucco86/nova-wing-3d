# QA153 | Pontuação por tempo, combos, esquivas e itens dos Five Cats

## Critérios de aceite

- Tempo da fase é o `elapsed` de simulação e congela em pausa/RPG radial. Não usar relógio real nem descontar segundos durante menus/cinemáticas.
- A entrada do chefe é vinculada ao `SECTORS[].duration`, então o bônus de rapidez depende do tempo gasto **depois** do período inicial de travessia. Isso evita prometer velocidades impossíveis.
- Cada inimigo abatido continua concedendo pontos antigos, somando até 80 pontos por combo quando mortes ocorrem com intervalo máximo de 4,5 segundos. Dano real interrompe o combo.
- Esquiva vale 25 pontos apenas quando um projétil cruza o plano da nave sem acertar e a trajetória passa entre 4 e 10 unidades dela; no máximo uma a cada 0,65 segundo. Projéteis defendidos por POD ou bloqueados pelo cenário não geram bônus; invulnerabilidade, escudo mágico e RPG pausado também não geram esquiva.
- Concluir a missão adiciona até 600 pontos de velocidade e 400 por zero dano físico. Nunca conceder esses bônus por derrota, QA ou duas vezes.
- Pontos e duração entregues ao ranking e troféus já incluem os bônus. Manter a proteção existente de pontos e a idempotência do evento de término.
- O HUD mostra apenas cronômetro compacto e número do combo junto à pontuação, sem alertas sobrepostos ao combate.
- Os troféus novos não destravam com partidas derrotadas ou modo QA; manter estrutura de save v1 e as conquistas já liberadas.
- Itens coletados: atum, peixe, ratinho e sachê. Reutilizar os quatro IDs legados no save, alterando arte/nome/efeito, para preservar progresso existente.
- ATUM dá XP, PEIXE dá escudo, RATINHO dá energia e SACHÊ dá escudo. Cada item também concede pontos e créditos; sem osso ou item canino na arte. Itens só afetam a missão real, sem nenhuma mudança na simulação de colisão.
- Executar `npm run build:check`, `npm run build`, `npm run validate`, testes Node e browser Playwright antes de integração na main.

Esta PR é fase de desenvolvimento e homologação. **Não publicar nem fazer merge em produção até validação.**
