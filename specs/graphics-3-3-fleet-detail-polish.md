# Graphics 3.3 — 3D Fleet Detail Pass (QA)

## Objetivo
Elevar o padrão perceptivo da frota além de blocos quadrados e superfícies lisas; foco em nave NOVA-7, robô transformável, inimigos, chefes e trânsito da Cidade 2.7. Implementação aditiva na candidata City 2.7, sem substituir a PR #187 de GLB premium NOVA-7 que deve ser integrada após revisão de conflitos e QA.

## Alterações no código
- `src/premium-model-details.js`: kit de acabamento 3D, superfícies angulares com extrusão e chanfragem, PBR metálico herdado dos modelos, aletas, grelhas, canhões laterais e colares luminosos.
- NOVA-7 e inimigos voadores: carenagem avançada, seis entradas de ar/aletinhas, pods de armas e detalhes nas duas turbinas. As superfícies principais usam os materiais existentes para manter as opções de pintura.
- Mecha Five Cats: novo peito segmentado, grelhas de dissipação, proteção do joelho, atuadores nos ombros, anéis na turbina dorsal e reforços nos pivôs reais das duas armas independentes.
- Chefes 1–10 e subchefes 1–10: armaduras laterais, grelhas de calor, reatores, canhões secundários e crista superior. Somente visual; não alteram `boss.userData.parts`, hitpoints ou cinematics.
- Tanques e walkers: painéis de proteção, grelhas laterais e LEDs, sem novas colisões.
- Carros e táxis: frontal aerodinâmico de malha própria, cúpula inclinada e acabamento PBR em instancing. Orçamento do tráfego cresce controladamente de 16 para 19 batches por tile; 136 grupos instanciados no cenário total da versão.
- Sem pacotes externos novos, shaders baixados ou alterações em armas, tempo da campanha, hitboxes, física ou IA de combate.

## Aceite automático e humano
- Testes `tests/graphics-3-3-premium-models.test.mjs`: geometria finita, pintura original da nave, integridade das peças articuladas, 10 chefes e subchefes, fraquezas persistentes, inimigos terrestres, instancing dos carros e modos Alto/Médio.
- `npm run format`, `npm run build:check`, `npm run lint`, `npm run test`, `npm run validate` e 4/4 Playwright no último SHA.
- Capturas reais e comparação do Antes/Depois para NOVA-7 no gameplay e hangar, robô durante boost, pelo menos um inimigo terrestre, subchefe e chefe em telas 16:9 e retrato.
- Medir FPS/p95 em celular e desktop. O código procedural não corresponde ainda à qualidade de asset pack profissional com UV, texturas 2K/PBR ou rig cinemático. O GLB da PR #187 será avaliado à parte.
- Nada deve ser promovido a DEV, HML ou produção sem os gates e homologação humana.
