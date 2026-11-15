# QA142: facade richness in GPU batches, traffic CPU reduction

## Hipótese

Não é suficiente aumentar draw calls para melhorar a cidade; gastar mais
GPU com novos objetos próximos do centro piora FPS. A nova rodada reutiliza
materiais e batches existentes e remove trabalho do loop de veículos.

## Critérios de arquitetura

- Skyline 42 torres: 84 novas nervuras anexadas, 42 perfis de coroas e
  756 janelas isoladas em Alto (seis níveis, três por torre).
  Esses objetos substituem ou ampliam **InstancedMesh existentes**,
  sem incrementar a quantidade de batches.
- Medium: 84 janelas iluminadas existentes permanecem visíveis.
- CPU: pré-computar matrizes locais de 22 batches, cachear por cenário
  no WeakMap, e posicionar somente instâncias desenhadas na qualidade ativa.
  Ao subir para Alto, os novos índices são inicializados antes de renderizar.
- Não alterar geometria de colisão, rotas de ônibus, eixos, nem
  custo de geração de sombras.

## Aceite

- Regressões dos loops por pausa/replay, clones, transição de qualidade e
  visualização do skyline de todos os ângulos.
- Draw calls: sem novos batches por prédios e veículos (9 batches cidade34,
  22 batches de veículos por tile).
- Benchmark em dispositivos reais: CPU JavaScript, GC, draw calls, FPS e
  frame-time p95/p99; pré-aquecimento e mesmas fases/câmeras.
- A CI browser existente requer verificação separada devido a falhas nos
  fluxos strategyDrawer anteriores à QA142.

**Draft. Sem merge/deploy de produção sem aprovação.**
