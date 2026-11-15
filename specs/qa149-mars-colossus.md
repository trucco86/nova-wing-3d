# QA149 | Colosso das Dunas articulado

## Problema
O chefe da fase 2 apresenta seis pernas mecânicas, mas não as movimenta
durante o combate. Os avisos de ataques ainda citam Stingray, incoerente com
o colosso escavador já desenhado no jogo.

## Comportamento e restrições
- Seis pernas e pés já existentes recebem marcha procedimental, movimento
  de preparação e impacto para dois tipos de ataque.
- A prensa vertical e o perfurador axial têm silhuetas distintas, com avisos
  de esquiva coerentes com as áreas de perigo já implementadas.
- Conservar geometria, materiais, hitboxes, pontos fracos, origem dos disparos,
  progressão, dano, HUD radial, som e controle do jogador.
- Pés nunca avançam abaixo da altura original. Poses usam tempo do combate,
  não tempo real; pause/replay mantém resultado determinístico.
- Cache WeakMap por objeto evita buscar seis pernas em toda atualização.
- Clones do chefe recebem referências próprias sem reutilizar meshes antigos.

## Gates
CI FULL com os quatro shards Playwright e smoke da fase 2.
Capturar o chefe no mobile em preparação e ataque, portrait e landscape,
e comparar draw calls, FPS e oclusão do HUD no mesmo dispositivo.
Sem evidência visual, a PR permanece Draft.
Dependências: QA148 #384 e QA138-146 #377.
