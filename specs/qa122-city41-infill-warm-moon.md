# QA122 | Cidade 4.1: densidade urbana, paleta cinematográfica e lua rachada

## Problema reportado

Na Fase 1 os espaços entre prédios e a infraestrutura viária parecem vazios; o rosa e azul ainda dominam o cenário; a lua rachada já existe mas não aparece na abertura da cidade. A correção deve preservar a navegação livre, o desempenho em celulares e a candidata consolidada 1.27.121.

## Escopo implementado

1. Novo módulo `city-122-street-infill.js` acrescenta calçadas estruturadas, baias de carga, abrigos de trânsito, letreiros âmbar de baixa intensidade, vitrines reais no térreo de edifícios, bancos e jardineiras. Todos os elementos são instanciados por material, presos ao bloco de rua ou ao lote do prédio e marcados `visualOnly`.
2. Reservas de shopping centers e ocupações de edifícios são verificadas por `cityFootprintsOverlap` antes de adicionar um novo lote. A área decorativa começa além de `|x| = 95` para não limitar a movimentação da nave ou as aproximações de combate.
3. Térreos e calçadas aparecem em Medium. Mobiliário secundário e acabamento fino pertencem ao grupo High. O ambiente duplicado por trecho de 1900 unidades mantém os lotes e os detalhes dentro de cada bloco, durante scroll e ascensão.
4. O céus/iluminação da Fase 1 passam de azul/rosa dominantes para concreto, vidro cinza, pedra quente, cobre fosco e âmbar discreto. As cores dos tiros/alertas/inimigos e os biomas dos demais planetas permanecem inalterados.
5. A lua rachada já modelada em `world-orbital-globe` passa a aparecer no céu da Fase 1, com três ramificações visíveis de fissuras. É recolhida durante a ascensão antes de mostrar a Lua verdadeira em órbita; não substitui nem antecipa a Lua real do encontro orbital.
6. Novos testes verificam posicionamento seguro, geometria de vitrine, pausas e troca de High/Medium, visibilidade da lua, troca de setor, cores e ausência de colisores.

## Critérios de aceite

- Os dois lados da avenida devem ter pelo menos vinte trechos seguros por lado com calçadas e ocupação funcional.
- A rua nunca recebe props no centro `|x| < 95`, nem sobre reservas de shopping ou edifícios procedurais.
- As vitrines são anexadas ao térreo dos prédios, não anúncios flutuantes, e os postes realmente tocam o solo.
- A lua rachada deve aparecer no primeiro trecho da Fase 1 e desaparecer sem coexistir com a Lua orbital real.
- Gráficos Medium mantêm os itens arquitetônicos importantes; High acrescenta mobiliário sem alterar física.
- Nenhum novo colisor/hitbox, luz dinâmico extra, textura remota ou motor de física. Instancing limitado a seis batches novos por trecho, só quatro em Medium.
- Build versionado `1.27.122`, `npm run validate`, quatro shards Playwright FULL e capturas reais WebGL desktop/mobile. Comparar o orçamento de draw calls e triângulos com QA114 e com a candidata 1.27.121, sem afrouxar limites.
- QA em celular físico, áudio, vista de diferentes alturas e homologação humana são necessárias antes de merge em release, HML ou produção.

## Isolamento e promoção

Este PR deve permanecer empilhado somente na branch de release 1.27.121. Não fazer merge em `main`, DEV/HML ou produção sem aprovação explícita. O preview do PR é a primeira etapa para avaliar os vazios, a paleta e a posição da lua rachada.
