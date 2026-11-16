# QA154 | Cockpit sem colisão, hierarquia de HUD e saída da equipe

## Comportamento esperado

- Em celular vertical, o painel opcional do cockpit fica acima dos botões de disparo/boost, nunca em cima deles. Radar duplicado do cockpit é omitido nesta largura; o radar tático e as informações da nave permanecem.
- Em celular horizontal com altura reduzida, o painel extra é omitido para liberar o campo de toque. O cockpit 3D e a HUD principal continuam funcionais.
- Nenhum dos sete botões altera seu identificador, área física ou comando. Preserve giro, Lock, piloto, RPG, controles para canhotos e área segura.
- Tempo da fase fica acima da pontuação e usa tipografia maior. Pontuação é secundária, mas continua visível até em 320px. A métrica continua baseada em tempo de simulação e pausa.
- Comunicação da equipe usa uma caixa de rádio compacta; aviso crítico/ataque perigoso/escudo/chefe têm prioridade. Pickup e aviso informativo cedem lugar à transmissão sem descartar o estado do jogo.
- Ao derrotar chefes comuns, Bia, Bob e Calvin têm três falas em sequência, sem caixas simultâneas. O salto de luz começa após a destruição principal, pode ser antecipado com BOOST após 4,9s ou se inicia automaticamente aos 5,8s. A sequência de luz fica 0,6s mais longa e com velocidade visual maior, sem ultrapassar os 8s totais e sem atrasar pontuação, compras e checkpoints.
- A fuga especial da Devastador conserva seu roteiro e tempo de 8s, sem diálogo genérico duplicado. Menu, morte, pontos e ranking não são modificados.
- Textos, botões e modais nas demais telas entram na matriz de auditoria visual; não reduzir a fonte abaixo de 11px de timer em telefones compactos.

## Matriz de aceitação

- Playwright em 320x568, 390x844 e 844x390: cockpit/controles e escudo/score sem sobreposição; horário acima dos pontos; rádio único e alertas prioritários; área de toque com alvos >=60px.
- Simulação determinística: momento de cada fala, início do warp por BOOST e automático, extensão do espetáculo e ausência de mudança no final Devastador.
- QA completo no SHA final: sync do HTML, formatter, build:check, lint, Node, quatro shards Playwright, screenshots reais portrait/landscape/desktop e inspeção no aparelho.
- Sem merge nem publicação sem esses gates; comparar PR QA153 e outras branches em andamento antes da integração.

## Evidência de CI e resolução de regressões

- A execução CI `43786007699` identificou um retrato de rádio oculto em 320px, colisão do painel do cockpit com a área de ações e teste legado exigindo score oculto.
- A correção restaura o avatar do rádio, reposiciona instrumentos do cockpit, e troca a antiga expectativa de ocultar score por legibilidade sem colisão. O teste de diálogo aguarda o fim do briefing, evitando comparar duas fases mutuamente exclusivas.
- Reexecutar gates no novo SHA. O teste de browser deve registrar geometria quando a colisão persistir; não considerar esses ajustes aprovados sem prova visual.
