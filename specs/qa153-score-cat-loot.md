# QA153 | Pontuação competitiva e itens de gatos

## Motivação
Pontuação por tempo de missão, combos de impactos reais, esquivas e zero dano,
sem aumentar a poluição do HUD. Ranking local permanece funcional offline e
ranking remoto permanece experimental sem antitrapaça.

## Economia e critérios
- Cronômetro usa o `elapsed` da fase (segundos de jogo), não relógio do sistema.
  Pausar, abrir RPG tático ou intermissões não aumenta o tempo da fase.
- O trecho de voo tem tempo mínimo roteirizado. Bônus de rapidez depende do
  tempo REAL até derrotar o chefe e concluir o setor, após a duração obrigatória.
  `max(0, min(600, round((duração_base+75-duração_real)*9)))`.
- Bônus de 175 pontos por uma missão sem sofrer dano, somente ao concluir.
- Combo apenas em impactos com dano confirmado: 2 pts iniciais, +3 a cada 5
  impactos em sequência de até 4,5s, máximo combo 30; dano recebido zera.
- Esquiva apenas se o projétil inimigo realmente cruzar perto da nave sem colidir,
  ou se colidir durante giro/dash efetivo; 12 pontos, limite de 80 por setor.
  Desvio visual ou pressionar botão sem ameaça não gera pontos.
- Derrotas, replays e QA não acumulam troféus ou pontos duplicados;
  `recordStageResult` idempotente no cliente e `runId` idempotente nos troféus.
- O ranking usa os campos `points` e `durationMs` que já existem. Novo score
  NÃO autoriza declarar o ranking remoto antitrapaça.

## Suprimentos dos Five Cats
- Drops: atum em lata, peixe, sachê, petisco em grãos, bolinha e erva-do-gato.
- Atum e sachê restauram escudo; peixe e petisco restauram energia; bolinha
  concede XP de RPG; erva-do-gato reabastece energia arcana tática.
- Cada drop também dá pontos e créditos. Sem osso ou areia como spawn.
- `can` (latinha) e legado `litter` são lidos do save anterior; a contagem
  antiga de areia é preservada, mas não aparece como loot ativo.
- Templates 3D têm material compartilhado por tipo, sem novos passes de pós.

## UX e QA
- Cronômetro dentro do placar existente, sem popup concorrente no centro do jogo.
- HUD de suprimentos passa a mostrar apenas o total; pausa ainda detalha tipos.
- Hangar exibe tempo, bônus de rapidez, integridade e melhor combo.
- Cinco novos troféus no Hall da Fama, com progressão persistida por métrica.
- Validar mobile em 390×844, 430×711 e landscape e FPS HIGH no dispositivo real.
- QA153 é um PR Draft. Não fazer merge sem Playwright, quality e validação visual.
