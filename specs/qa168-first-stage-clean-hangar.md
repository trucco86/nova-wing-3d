# QA168: abertura limpa do hangar (somente setor 1)

## Evidência de produto

O preview móvel do PR #413 mostrava tags 3D de aliados enormes, joystick e botões de combate durante a cinemática. O fundo/parte de trás do hangar estava aberto e os seis cortes confundiam o sentido da viagem.

## Contrato implementado

- **Três momentos**: `hangar` (0 a 1,6 s), `exit` (1,6 a 4,4 s) e `approach` (4,4 a 6,5 s). A câmera permanece atrás das cinco naves, olhando para o portão frontal, com interpolação suave e sem cortes invertidos.
- **Cenário**: bulkhead traseiro de largura total, teto central fechado e estrutura frontal preservada. A abertura frontal permanece livre durante a aceleração.
- **Cinemática sem tags**: os quatro sprites de identificação aliados ficam `visible=false` em toda a introdução. Eles voltam ao modo normal apenas ao iniciar o gameplay ou pular a animação.
- **Cinemática sem HUD jogável**: estado de CSS dedicado `body.launch-cinematic` oculta touch, joystick, tiro, boost, RPG, HUD, radar, avisos, identificação de esquadrilha, controles e pausa. Apenas `#launchSkip` continua disponível. A classe é removida juntamente com a câmera cinematográfica, tanto no fim quanto ao pular, e na limpeza da missão.
- **Escopo**: `sectorIndex === 0` e introdução habilitada. Nenhuma mudança em fases 2 a 10, cronômetro de gameplay, pilotagem, skins selecionadas ou mecânicas já aprovadas.
- **Performance**: nenhuma câmera adicional ou modelo de piloto alocado durante o lançamento; a nave protagonista continua a mesma instância do gameplay.

## Testes

- Node: `tests/stage-one-launch-intro.test.mjs` (três momentos, continuidade móvel, teto e fundo, movimento de portão).
- Node: `tests/five-cats-formation-supers.test.mjs` (IFF oculto, classe de UI, retorno após o fim e ao pular).
- Navegador: `tests/browser/five-cats-formation.spec.mjs` (390×844 e desktop, três capturas, tags/UI ocultos, transição para jogo e seleção de nave preservada).
- Fluxo: `npm run format`, `npm run build`, `npm run validate`, Playwright desktop/mobile no PR.

## Pendências de homologação

Verificar os três screenshots Playwright e filmagem real do iPhone: enquadramento do portão, naves cruzando a saída e nenhum vazamento de HUD no primeiro frame. PR fica em draft, sem merge ou deploy em produção até aprovação explícita.
