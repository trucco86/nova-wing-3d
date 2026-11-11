# QA108 | Colisão somente em geometria visível dos destroços

## Problema
O cálculo de AABB em `city-falling-solids.js` usa todas as partes de um
destroço, mesmo quando a malha ou algum grupo ancestral está oculto. Isso
pode deixar colisão ativa em uma região sem objeto renderizado.

## Comportamento esperado
- O billboard, hovercar e fragmentos da fase 1 só são sólidos enquanto
  possuem geometria visível até a raiz do cenário.
- Malhas ocultas não ampliam o AABB de malhas remanescentes.
- Se nenhuma malha da entidade estiver visível, não existe collider ativo.
- A geometria que voltar a ser exibida deve restaurar o collider automaticamente.
- O cálculo continua usando matrizes globais e swept contact, sem criar
  limite invisível na área da nave.
- Não alterar spawn, arquitetura, loja, chefes, progressão, gráficos das
  fases 1 e 2, controles ou efeito da subida orbital aprovado na QA107.

## Aceite
1. Destroço com grupo visível mas todas as malhas ocultas não possui collider.
2. Ocultação por ancestral remove collider mesmo com malha filha visível.
3. Malha visível isolada mantém AABB real e finito.
4. Outras entidades visíveis permanecem com collider independente.
5. Reset, saída da fase e mudança de cenário não deixam colisão fantasma.
6. CI Node/lint/build, quatro shards browser e inspeção visual de
   colisões em fase 1 aprovados no SHA final antes de merge.

## Restrição de release
Candidata empilhada sobre QA107 (`fix/city-phase1-coherence-20261110`);
proposta para 1.27.108. Nunca publicar sem promoção validada de QA107.
