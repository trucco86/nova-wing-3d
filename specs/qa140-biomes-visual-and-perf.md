# QA140: asteroides, Europa e Netuno com orçamento de render estável

Objetivo: continuar o padrão visual de Marte e Saturno, elevando materiais,
profundidade geológica e atmosferas com baking na montagem, não com novos
modelos ou pós-processamento em cada quadro.

## Escopo
- Asteroides: rocha instanciada com fraturas e sedimentos em cores de vértice;
  quantidade de vértices/draw calls e corredor de combate preservados.
- Europa: mesma malha de 35 pontos por crista, cores mais contrastantes,
  ocultação dos VFX de gelo fora da superfície e no modo Médio.
- Netuno: volumes atmosféricos instanciados inalterados, com gradientes
  de gelo em cores de vértice e PBR frio, sem novas texturas ou objetos.
- Física da fase 3: usa scratch para sweep e deixa posição do jogador e
  caixas de colisão idênticas.

## Riscos e critérios
- Confirmar WebGL shader/vertex color de Netuno em dispositivo móvel e desktop.
- Comparar, usando percurso e câmera idênticos, 3 capturas por fase nos modos
  Médio e Alto. Exigir ausência de oclusão da nave, inimigos e indicadores.
- Validar FPS, p95/p99, draw calls, triângulos, uso JS/GPU e a transição entre
  fases, reset/replay e comportamento de chefes.
- Testes CI/Playwright devem passar no último SHA. QA visual e FPS reais
  ainda serão avaliados manualmente.

**PR Draft, sem merge/deploy de produção antes da aprovação explícita.**
