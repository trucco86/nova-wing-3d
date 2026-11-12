# QA113 | Graphics 4.0: arquitetura premium com custo previsível

## Objetivo

Aprofundar o protótipo da QA112 sem regressão gráfica, física ou de
desempenho. Não expandir a campanha antes da comparação visual humana.

## Entrega delimitada

- Preservar intervalo de 285 m e os mesmos hosts/colliders da QA112.
- Entradas comerciais construídas com pórticos, suportes, marquises
  chanfradas, vitrines recuadas e sofito escuro.
- Níveis superiores com molduras metálicas profundas, divisórias e
  detalhes de janela próximos apenas no modo Alto.
- Edifícios cívicos: coroa assimétrica e ombros estilizados; edifícios
  industriais: painéis de ventilação e reforços estruturais com suporte.
- Melhorar resposta dos metais/vidros sob a luz usando uma **cubemap
  procedural de apenas seis faces de 32 x 32 px**, criada uma vez e
  compartilhada pelos quatro materiais do trecho, sem download e
  sem câmeras ou passes SSR permanentes. Fallback Node sem DOM.
- Preservar mapas PBR de roughness e normal, mesma geometria por
  família de material, no máximo quatro draw units por bairro.
- Remover alocações de vetores por quad durante a geração,
  construir bounds por malha e manter frustum culling explícito.

## Controle de custos

- Máximo de 4 malhas de material por tile do protótipo, sem malha
  adicional por janela, ventilação ou marquise.
- Geometria agregada abaixo de 3 MiB por tile e menos de 45 mil
  triângulos por tile. Os limites são testados sobre buffers reais.
- Não alterar limite existente de 260 instanced meshes na cidade,
  orçamento geral de draw calls e nem limites de Pixel Ratio móvel.
- Tamanho de GPU para a cubemap fonte: 6 x 32 x 32 x 4 bytes,
  sem contar mipmaps/PMREM; renderizações adicionais: 0 por frame.
  Medir desenho por frame e não confundir instâncias com draw calls.
- O modo Médio preserva a arquitetura, reflexos e vidros;
  o modo Alto acrescenta somente detalhes finos de guarnição.
- Comparação A/B no mesmo quadro em desktop/mobile para verificar
  erros WebGL, contagem de draw calls, triângulos e captura visual.

## Critérios de aceite

1. Regras espaciais QA112 e anúncios QA110 continuam aprovados.
2. Tiro/plasma QA111 não regrediram, especialmente o RMS da cauda
   do tiro no OfflineAudioContext.
3. Node `npm run validate`, 4 shards Playwright e deploy isolado
   verdes no SHA final.
4. Comparação humana de before/after, leitura e clipping em
   dispositivos reais antes de ampliar o trecho.
5. Sem merge na main nem promoção de produção sem autorização.
