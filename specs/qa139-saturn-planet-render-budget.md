# QA139: render premium dos destinos sem penalizar combate

## Objetivo
Entregar um Saturno com anéis mais ricos e preservar a performance em todas as
fases de destino, sem introduzir geometria, novos passes, pós-processamento,
filtros ou simulação extra.

## Mudanças
- O shader atual do anel desenha as faixas C/B/A, incluindo suas tonalidades.
  Removidos 3 meshes e 3 materiais redundantes. O anel principal mantém
  profundidade, inclinação, sombra planetária e a divisão de Cassini.
- Cache WeakMap para objetos de vista, nuvens, luz atmosférica e raio de escape.
  O cache não é serializado com THREE.Object3D.userData.
- Os 96 rastros de fuga mantêm a malha original; suas coordenadas XY são
  pré-computadas e o vetor Z só é atualizado quando há warp.
- O gelo em Saturno deixa de recalcular vários hashes por instância e quadro.
  Valores constantes são pré-computados, mas movimentos usam o relógio de
  missão como antes, mantendo pausa e replay iguais.

## Homologação
- npm run validate, build:check, Playwright shards 1–4.
- Inspecionar Saturno em panorama, portrait, orbitação, gelo, fenda de Cassini
  e combate. Confirmar ausência de anéis na trajetória e ausência de
  artefatos transparentes atrás do globo.
- Comparar, no mesmo hardware e percurso, draw calls, triangles, p95/p99
  frame time e memória com QA138.
- Verificar setores 4–10, HUD, troca de setor, pausa, reset e ondas inimigas.

**Aprovação humana obrigatória antes de merge ou produção.**
