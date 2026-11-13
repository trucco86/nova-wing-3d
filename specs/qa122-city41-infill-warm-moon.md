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

## Iteração de profundidade, vida urbana e continuidade lunar (13/11)

Feedback adicional: a Lua da abertura não pode se sobrepor aos prédios; o objeto orbital precisa conservar as fissuras. A cidade deve ter árvores, postes, pedestres, luzes urbanas variadas e comunicação visual distribuída, sem regressão de física ou queda de FPS.

- Lua da abertura: posição no céu profundo, atrás dos prédios na resolução de profundidade; permanece dentro do plano distante da câmera (2500 unidades). Superfície recebe crateras e maria adicionais sem malha pesada.
- Lua da órbita: mantém crateras do shader orbital e recebe o mesmo traçado de fraturas ramificadas com luz âmbar. Não coexistem duas luas no mesmo frame durante a transição.
- Passeios arborizados: copas low-poly e troncos apoiados na calçada existente, apenas nos lotes seguros, sem mudar caixas de colisão; um batch adicional de folhagem por tile.
- Pessoas: silhuetas discretas de pedestres de serviço, deslocamento determinístico e restrito ao passeio; atualização do buffer apenas quando a distância avançada muda de faixa, e somente enquanto o jogo avança.
- Neón e anúncios: mais letreiros arquitetônicos alternando âmbar, verde-água e branco, e painéis de abrigo ancorados. Preservar os inventários de anúncios genéricos em atlas dos edifícios, sua contagem contratada (7 a 12 telas por tile) e os mesmos dois draw calls.
- Matriz de regressão: vista desktop/mobile abertura, avanço, perfil Medium/High, pausa e reset, oclusão da Lua por edifícios, colisões existentes, render stats e shader WebGL. Capturas reais e FPS em dispositivo físico continuam obrigatórios antes de qualquer promoção.

## Critérios de aceite

- Os dois lados da avenida devem ter pelo menos vinte trechos seguros por lado com calçadas e ocupação funcional.
- A rua nunca recebe props no centro `|x| < 95`, nem sobre reservas de shopping ou edifícios procedurais.
- As vitrines são anexadas ao térreo dos prédios, não anúncios flutuantes, e os postes realmente tocam o solo.
- A lua rachada deve aparecer no primeiro trecho da Fase 1 e desaparecer sem coexistir com a Lua orbital real.
- Gráficos Medium mantêm os itens arquitetônicos importantes; High acrescenta mobiliário sem alterar física.
- Nenhum novo colisor/hitbox, luz dinâmico extra, textura remota ou motor de física. Instancing limitado a sete batches novos por trecho, cinco em Medium (folhagem incluída); orçamento GPU de draw calls deve ser medido e não pode ultrapassar os gates estritos da arquitetura.
- Build versionado `1.27.122`, `npm run validate`, quatro shards Playwright FULL e capturas reais WebGL desktop/mobile. Comparar o orçamento de draw calls e triângulos com QA114 e com a candidata 1.27.121, sem afrouxar limites.
- QA em celular físico, áudio, vista de diferentes alturas e homologação humana são necessárias antes de merge em release, HML ou produção.

## Isolamento e promoção

Este PR deve permanecer empilhado somente na branch de release 1.27.121. Não fazer merge em `main`, DEV/HML ou produção sem aprovação explícita. O preview do PR é a primeira etapa para avaliar os vazios, a paleta e a posição da lua rachada.
