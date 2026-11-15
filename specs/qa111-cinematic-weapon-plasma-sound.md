# QA111 | Armas cinematográficas e carga de plasma contínua

## Problema de homologação

O som do tiro principal era magro, eletrônico e repetitivo. A carga do
plasma tocava um breve som de 0,65 s que desaparecia enquanto a barra
ainda estava preenchendo. O usuário pede impacto mais convincente.

## Contrato observável

1. Tiro da nave: transiente metálico rápido, corpo triangular médio,
   impacto grave curto e cauda texturizada sem soar como beep.
2. Tiro do robô: canhão mecanicamente mais pesado e distinto da nave.
3. Carregamento do plasma: camada de baixo, corrente metálica e ruído
   filtrado que seguem o valor real do medidor 0 a 1,5 segundo.
   Não criar novas fontes a cada frame e não reiniciar o som ao
   atualizar o nível de carga.
4. Soltar: interromper o carregamento e tocar um disparo maior com
   estalo espectral, pressão grave e dissipação curta.
5. Vozes: SFX transientes respeitam limite de 32 vozes e cooldown;
   3 fontes persistentes do plasma criadas uma vez e liberadas no
   destroy. O volume depende do slider SFX já existente.
6. Áudio mutado, tela pausada, perda de foco, controles soltos e
   saída do jogo não podem manter nem reativar a carga.
7. Mix final sem clipping (pico absoluto inferior a 0,98 no
   OfflineAudioContext). Sem gravações ou samples externos.
8. Todas as mudanças são sintetizadas e originais, sem músicas ou
   efeitos comerciais.
9. QA111 é uma camada sobre QA110/PR #321. Preview inclui
   cidade premium e áudio; nenhuma promoção à produção sem QA FULL
   e aprovação visual e auditiva.

## Verificação

- Node: perfil de frequências/graves, ataques, limites de ganho,
  cooldown, modulação de disparos, automação de carga, silêncio,
  mute e ausência de leak de fontes.
- Browser: renderização OfflineAudioContext da mixagem em 20 s,
  charge, release, ataque/cauda; assertivas RMS finito, peak abaixo
  de 0,98, pausa e mute zero.
- Gameplay: segurar e soltar FIRE no desktop/mobile em nave e robô,
  conferir carga acima de 0,8 s, volume, pausa e performance.
- CI FULL do SHA final e 4 shards Playwright; WebGL city QA110 sem
  regressão e orçamento gráfico preservado.

## Limites

Som mais impactante é avaliação perceptiva humana. Estes testes
verificam sinais e comportamento, mas não substituem ouvir em fones,
alto-falante de celular e sistema de som real.
