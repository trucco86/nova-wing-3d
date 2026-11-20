# QA169: hangar cinematográfico e revisão dos chefes

## Base do pedido

Referência visual aprovada: hangar futurista profundo, luzes ciano/âmbar, estrutura industrial estratificada, naves em formação vistas por trás com passagem clara ao exterior. A abertura é só na fase 1. A versão anterior com seis ângulos e HUD durante a decolagem foi rejeitada.

## Hangar 3D

- Três momentos contínuos, 6,5 s, sem close-up de piloto, corte frontal ou câmera invertida.
- A câmera começa mais ampla (FOV ~76°) para mostrar profundidade, faz push-in/dolly ótico no eixo da pista (FOV ~55° no meio) e retorna ao gameplay (60°); roll e vibração são sutis e zerados ao terminar ou pular.
- Galerias laterais com vidro translúcido, vigas e cruzetas no teto, colunas de observação, iluminação de aproximação, juntas no piso e balizas âmbar. Todos os conjuntos repetidos usam InstancedMesh para limitar draw calls, sem sombras dinâmicas ou pós-processamento novo.
- Três feixes de luz volumétrica de geometria transparente e balizas pulsantes usam materiais compartilhados; sem alocação de meshes por frame.
- Parede traseira e teto fechados; porta frontal atravessada sem troca da nave central. Tags, nomes, HUD e controles ocultos durante a cinemática. Só o botão pular permanece.

## Auditoria do combate dos chefes

- **Hidra**: golpes repetidos de agarrar/varrer alternam usando o conjunto real de cabeças e membros já modelados. Indicador de ataque parte do modelo da cabeça, não do centro fictício.
- **Ômega**: quando há armamento operacional, repetições de mordida/martelo, agarrar/varrer e garras/varrer recebem alternativas já animadas. Mantêm órbita de 360° e reação angular progressiva da carcaça.
- **Marvin**: detectado defeito de integração: o fighter final ocultava o rosto pitbull, duas garras e seis tentáculos originais. Rosto, duas garras e dois tentáculos agora usam a geometria original, anexada à nave preta na orientação frontal correta. Radar aponta para a peça exibida. Repetição de mordida frontal pode trocar por rajada de armas em vez de simular um zoom/mordida invisível.
- Geradores destruídos não são recriados nem usados como origem de golpes. A nova variedade é somente seleção determinística ao preparar o golpe, sem retargeting após windup e sem alterar raio de dano, HP ou esquiva.

## QA170: correção do enquadramento frontal de Marvin

Inspeção das imagens Playwright 1366×768 da QA169 revelou rosto e orelhas cortados no topo, com a cabeça destacada da estrutura da nave. A montagem visual `marvin-pitbull` foi reposicionada de (0,25,34) para (0,14,28) no sistema de coordenadas anterior ao reparenting para a nave real. O deslocamento é **somente visual**; partes destrutíveis, hitboxes de dano e pontos fracos permanecem inalterados. O teste Node fixa o limite vertical do encaixe; a imagem da versão 1.27.162 ainda requer nova captura para comprovar ausência de corte no desktop e mobile.

## Limitações explícitas

- Ainda não há colisão geométrica dos braços de Hidra, Ômega e Marvin com o casco do jogador. O dano permanece conforme área lógica anunciada no radar.
- Não declarar enquadramento perfeito dos chefes visto de frente sem captura Playwright e inspeção visual do preview, especialmente mobile.
- Inspeção em iPhone real, FPS e memória continuam pendentes.

## Gates

1. `npm run format`, `npm run build`, `npm run validate`, `build:check`, Playwright desktop/mobile.
2. Testes `tests/stage-one-launch-intro.test.mjs` e `tests/qa169-premium-hangar-boss-regressions.test.mjs`: zoom, FOV 60 pós-skip, instancing, rostro/garras/tentáculos visíveis, anti-repetição com hardware destruído, radar nas origens.
3. Screenshots nos 3 momentos do hangar e nos encontros Hidra/Ômega/Marvin.
4. PR draft em branch isolada, sem merge/deploy de produção sem aprovação explícita.
