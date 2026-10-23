# v1.19 — Caças com papéis de combate

## Objetivo

NW-06: tornar os três modelos de caças comuns reconhecíveis pelo movimento e ataque. Hoje sua travessia pode terminar antes do primeiro disparo.

## Critérios

- Web: aproximação até z=-90, janela de combate até 3,2 segundos de idade, depois saída na velocidade da rota. Movimento não depende do FPS.
- Modelos alternam dentro das ondas: perseguidor com tiro simples, interceptador lateral com tiro duplo, bombardeiro com leque de três tiros.
- Escala web dos caças comuns passa de 0,65 para 1,3 para leitura em celular; meia caixa de colisão passa a (5,5; 2,6; 4,5), acompanhando o casco ampliado. Nativos preservam escala e colisão anteriores.
- Sinal luminoso no canhão nos últimos 0,55 segundos da carga. Primeiro ataque somente após 1,2 segundos; disparos seguintes a cada 1,8 segundos.
- Pausa congela movimento, carga e disparo; reinício redefine a sequência. Caças continuam destrutíveis por tiros e bombas, com mesmos HP e recompensas.
- Não alterar chefe, subchefe, controles, saves ou comportamento nativo. A variedade de subchefes continua pendente em NW-06.
- Testar o jogo real, capturar desktop/mobile e registrar tempo de frames no cenário da CI como diagnóstico, sem prometer FPS em aparelhos físicos.

## Validação

Testes puros de movimento e alvos, regressão do harness, quality e browser no commit final. Bundle abaixo de 2 MB.
