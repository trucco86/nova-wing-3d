# Planetary Journeys 5.0 — campanha com chegada e fuga cinematográficas

## Aprovação e objetivo

A experiência de Marte 4.3 foi aprovada para servir de referência de ritmo e continuidade:
a nave deve **chegar a um destino identificável, cruzar uma transição diegética,
jogar naquele ambiente e escapar ao derrotar o chefe**. Não copiar os mesmos
anéis, arranhões, nuvens ou silhuetas para todas as fases.

## Itinerário dirigido por destino

| Setor | Destino visual / transição | Saída |
|---|---|---|
| 1 | Terra: cidade -> lançamento e espaço (existente) | aceleração espacial após boss |
| 2 | Marte: órbita -> areia e deserto (existente) | ascensão marciana |
| 3 | Mega-asteroide: abertura -> caverna (existente) | fuga pelo túnel em colapso |
| 4 | Júpiter: estação Órbita-9 -> hangar | saída pela eclusa |
| 5 | Vênus: espaço -> nuvens amarelas e descargas de plasma | subida através das nuvens |
| 6 | Europa: órbita joviana -> fenda glacial | retorno ao espaço gelado |
| 7 | Netuno: atmosfera azul -> colmeia suspensa | rompimento da tempestade |
| 8 | Saturno: anéis *do planeta* -> bloqueio da frota | ruptura do bloqueio |
| 9 | Abismo de Órion: entrada gravitacional | ruptura do corredor |
| 10 | Titã: névoa externa -> fortaleza de Marvin | vitória dos Five Cats |

Os setores 3 e 4 continuam cavernoso/espacial; não devem virar deserto. Saturno
tem anéis astronomicamente plausíveis **presos ao globo**, não arcos de voo
no centro da tela. A fase 6 usa Europa, que é uma lua e não um planeta.
Netuno é atmosférico, sem inventar solo sólido no gigante gasoso.

## Regras verificáveis

- Fases 4–10 começam em espaço profundo por 6s, mostram o globo/orbita até 12s,
  cruzam a entrada entre 12 e 25s, então liberam combate integral. A névoa
  atinge um pico no meio e se dissipa até ~31s. O primeiro plano de UI é preservado.
- Fases 1/2/3 **preservam seus próprios modos** já autorados.
- Subchefes, rivais, objetos e drops não surgem antes do fim da introdução.
  O minigame da colmeia do setor 7 começa após essa chegada, não aos 8s.
- A colisão e o checkpoint nunca dependem do planeta visual; os materiais/planos
  e partículas carregam `userData.visualOnly` e não criam hitboxes.
- Após vencer o boss: colapso existente -> 3,3s de aceleração/corridor visual
  no final dos 8s existentes. Entrada do setor seguinte depende do mapa/loja,
  sem falsa viagem automática que ignore o gate. Não altera recompensa, save nem ranking.
- Transições movem-se somente com o relógio de jogo. Pausa/reinício têm
  resultado determinístico, sem setInterval, timers ou novos endpoints.
- Isolamento entre cenários: Lua rachada apenas onde faz sentido;
  nada de reutilizar o planeta de Marte para Netuno ou Europa.
- Mobile: HUD permanece no topo, controles na base, gameplay livre no centro;
  efeitos de neblina não podem ocultar tiro/robô/boost.

## Verificação e limites

Rodar `npm run release:prepare -- 1.27.58`, format, build, validate,
browser, QA visual em celular e análise de draw calls / frames p95.
Aproveitar o Developer QA para entrar diretamente em todas as fases, sem rank/save.

Esta entrega é uma **candidata de QA**. Descrições de mundos e novos estilos
não são homologação visual; nenhum merge em DEV/HML/PROD enquanto CI obrigatória
estiver vermelha. Se o tempo de entrada afetar dificuldade/boss, ajustar pacing
em branch posterior, preservando os gates.
