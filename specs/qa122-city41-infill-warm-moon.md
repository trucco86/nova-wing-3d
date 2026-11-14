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

## Iteração 4.3: quadras externas funcionais

Novo feedback: o exterior continua vazio entre torres. A expansão não deve adicionar objetos aleatórios no ar nem criar hitboxes invisíveis.

- `planCity122OuterParcels` distribui solo urbano ao longo dos dois lados dos 1.900 metros, priorizando corredores de x = ±146 a ±352. Os lotes respeitam uma margem horizontal de 125 unidades para pista e maglev.
- A reserva considera os 200 prédios procedurais, 24 torres distritais, oito plataformas do espaçoporto, os três complexos comerciais e todas as novas quadras entre si. Um lote ocupado é ignorado; nunca deslocar decoração para a pista.
- Seis funções visuais, sem física adicional: estacionamentos com carros apoiados; jardins de bolso com árvores e bancos; depósitos logísticos com cobertura sustentada; pequenas praças e abrigos; pátios técnicos com transformadores; vias de acesso com faixas, postes e sinalização.
- `city122-grounded-pedestrian-pavements` e os seis demais batches existentes incorporam a nova geometria, **sem adicionar draw calls ou novos materiais**. Os pisos externos têm base em y = -7, sem flutuar.
- Os dois trechos de estrada herdam a geometria durante rolagem e ascensão; perfis Medium/High, Lua, emissões, anúncios e colisões de gameplay devem permanecer intactos.
- Testes novos cobrem distribuição nas duas margens, extremos do percurso, não sobreposição com todas as reservas, tipologia, instancing e observação WebGL desktop/mobile. Retêm-se todos os gates de performance e homologação de QA122.

## Iteração 4.4: solo urbano, detalhes de vazio e impactos premium

O plano de melhoria concentra a densidade em solo desocupado, sem ampliar a cidade com blocos aleatórios ou alterar a navegação.

1. `planCity122GroundCells`: células de até 26 x 30 unidades entre os 200 prédios, torres distritais, plataformas, três complexos comerciais e quadras 4.3; cada célula permanece fora da faixa |x| < 125 e dentro do trecho de 1.900 unidades.
2. Cinco leituras do solo combinam asfalto de serviço, pátios de concreto, faixas de circulação, fissuras técnicas, linhas e grelhas. O pavimento encosta no nível y = -7; os pequenos detalhes usam os cinco batches Medium já existentes, sem novas texturas remotas.
3. Fontes de vapor apoiadas em grelhas concretas usam **um novo batch High instanciado por tile**, transparente e sem sombras dinâmicas. O efeito varia por distância de viagem, não cria partículas por frame e fica invisível no perfil Medium. Linhas de sinalização no solo usam o batch de luz âmbar Medium existente, com variação discreta de brilho.
4. Os impactos roteirizados da cidade recebem núcleo térmico quente, quatro camadas de fumaça/fuligem, halo de choque mais curto, 12 detritos em um InstancedMesh, faíscas e marca de queimado temporária. O ciclo máximo de 2,25s não cria novos meshes a cada atualização e não altera dano, cronograma da fase nem hitboxes.
5. Orçamento QA122 atualizado de **7 para 8 InstancedMeshes por tile**, aumento estritamente de um batch opcional High para vapor. Não afrouxar os orçamentos medidos do restante do jogo; inspecionar chamadas e triângulos em dispositivo móvel.
6. Homologação: Node targeted, `npm run validate`, screenshot desktop/mobile em WebGL real, quatro shards FULL, observação da cidade em voo e teste de FPS/temperatura em celular físico.

## Critérios de aceite

- Os dois lados da avenida devem ter pelo menos vinte trechos seguros por lado com calçadas e ocupação funcional.
- A rua nunca recebe props no centro `|x| < 95`, nem sobre reservas de shopping ou edifícios procedurais.
- As vitrines são anexadas ao térreo dos prédios, não anúncios flutuantes, e os postes realmente tocam o solo.
- A lua rachada deve aparecer no primeiro trecho da Fase 1 e desaparecer sem coexistir com a Lua orbital real.
- Gráficos Medium mantêm os itens arquitetônicos importantes; High acrescenta mobiliário sem alterar física.
- Nenhum novo colisor/hitbox, luz dinâmico extra, textura remota ou motor de física. Instancing limitado a oito batches por trecho (cinco Medium, três High, incluindo vapor); orçamento GPU de draw calls deve ser medido e não pode ultrapassar os gates estritos da arquitetura.
- Build versionado `1.27.122`, `npm run validate`, quatro shards Playwright FULL e capturas reais WebGL desktop/mobile. Comparar o orçamento de draw calls e triângulos com QA114 e com a candidata 1.27.121, sem afrouxar limites.
- QA em celular físico, áudio, vista de diferentes alturas e homologação humana são necessárias antes de merge em release, HML ou produção.

## Isolamento e promoção

Este PR deve permanecer empilhado somente na branch de release 1.27.121. Não fazer merge em `main`, DEV/HML ou produção sem aprovação explícita. O preview do PR é a primeira etapa para avaliar os vazios, a paleta e a posição da lua rachada.
