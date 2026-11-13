# QA112 | Graphics 4.0, prova de conceito arquitetônica de 285 metros

## Hipótese de produto

Mais neon ou alterações superficiais de roughness não elevam a percepção
de qualidade enquanto os próprios edifícios continuam silhuetas em caixa.
O novo protótipo deve ter profundidade de fachada realmente modelada,
janelas divididas/recuadas, base comercial e coroas de telhado chanfradas,
com custo controlado e sem mudar nenhuma mecânica homologada.

## Contrato de escopo

- Somente faixa local de z=-115 até z=-400 na fase 1, um percurso de
  285 unidades, durante os dois tiles cívico/industrial; sem mudar o
  restante da campanha.
- Selecionar até 12 edifícios reais por tile, com preferência por
  x mais próximo do corredor e distribuição ao longo do trecho.
- Excluir edifícios que já hospedam espaços de mídia QA110 ou
  publicidade existente, evitar clipping com outras torres e
  preservar o corredor central de voo x±118.
- Modelar no mesmo host: pórticos e marquises com suportes,
  fachadas de 3D real, painéis de vidro com recuo, cornijas
  salientes, ombros arquitetônicos chanfrados e volume de coroa.
- Materiais PBR com roughness/normal procedural determinístico,
  diferentes tons para os dois bairros e vidro clearcoat de
  custo reduzido. Não utilizar transmission ou reflexos SSR de
  múltiplas passagens em celulares.
- Um `BufferGeometry` combinado por família de material/tile,
  nunca um draw call por janela; três malhas ativas em Medium e
  uma malha adicional em High por tile.
- Nenhum objeto de decoração passa a ser físico; o collider
  permanece no edifício zonado pela QA109.
- Não reestruturar o renderer ou acrescentar complexidade a
  todas as fases antes de provar ganho visual e medir custos.

## Evidência e aceite

1. Teste estrutural garante dois bairros, faixa de 285 unidades,
   edifícios fixados a footprints existentes, exclusões da publicidade
   e caixas 3D disjuntas de outras torres.
2. Todos os buffers e índices finitos, malhas reutilizadas por
   material, materiais PBR completos e qualidade Medium/High
   funcionando, sem novos `InstancedMesh` além do limite de 260.
3. Teste navegador captura quatro cenas do trecho hero em
   desktop/mobile, sem erro JS/shader; comparar mesmas câmeras
   com QA111 e registrar draw calls e triângulos reais.
4. FPS e qualidade percebida exigem aferição em hardware real
   e revisão de screenshots. Testes de compilação não confirmam
   impacto visual.
5. Resolução, colisões, física, progressão, HUD, tiro, áudio e
   Boss logic não podem regredir.
6. Só expandir Graphics 4.0 para as demais fases se a avaliação
   visual superar claramente a QA111 com degradação aceitável
   e reproduzível de desempenho.

## Dependências

Stack baseada nas PRs #319, #320, #321, #322. Já havia dois
shards Playwright vermelhos na QA111 por `shotBody` com RMS abaixo
do limiar, apesar de 768 testes Node aprovados. A QA112
precisa reparar a causa ou separar o problema antes de liberação.

Não fazer merge ou deploy de produção sem CI FULL, QA
visual mobile e autorização explícita do proprietário.
