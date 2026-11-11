# QA109 | Coerência espacial e recuperação visual da cidade

## Origem e bloqueio

Homologação humana da candidata 1.27.108 / PR #319 rejeitada: prédios
parecem deslizar em esteira, se atravessam, um edifício invade a linha do
trem, objetos flutuam e a cidade perdeu densidade visual e legibilidade.
**P0: não publicar esta candidata em produção.**

## Causa técnica confirmada

- O gerador das 200 torres-base posicionava X aleatório sem considerar
  corredores de maglev, estações, shopping centers e a travessia aérea.
- Os distritos verificavam somente colisão com edifícios-base, não com
  os complexos de varejo, e torres próximas tinham distanciamento Z
  de 30 unidades apesar de footprint de 29 + margens.
- Searchlights, hologramas e painéis de distritos da City32 usavam XYZ
  independentes do skyline e pareciam objetos soltos.
- Busways da City33 suspendiam dezenas de decks e estações sem
  suportes até o solo.
- As duas instâncias de tile de 1.900 unidades têm arquitetura clonada:
  ainda pode haver efeito perceptual de repetição em sessões longas.

## Primeiro corte QA109

1. Reservar corredores de trem e estações, shopping centers e travessia
   aérea **antes** de instanciar cada prédio-base.
2. Distribuir os 200 edifícios existentes sem reduzir a quantidade.
3. Usar o mesmo mapa de ocupação para as 24 torres distritais; afastar
   footprints em Z para evitar sobreposição de fachadas.
4. Suportar os pads do espaçoporto por colunas reais até a rua, sem
   cruzar o trem.
5. Ancorar os painéis comerciais, hologramas e holofotes a paredes e
   coberturas reais dos prédios.
6. Sustentar os viadutos de ônibus com colunas externas à área de voo.
7. Preservar a identidade premium existente, o trem, o trânsito, as
   vitrines e detalhes, com perfis Alto/Médio, sem esconder a cidade
   inteira como falso conserto.

## Aceite automatizado

- 200 edifícios-base e 24 torres distritais sem interpenetração no mapa
  X/Z, sem prédios sobre a faixa de trem, estações e complexos comerciais.
- Nenhuma torre alta atravessa o maglev transversal em y=59.
- Holofotes sobre telhados, hologramas na face frontal e suportes do
  busway no solo y=-7, fora do volume da nave.
- Pausa, reset, colisão, BOOST, GIRO, fase 3, loja e chefes sem
  regressão. Testes Node e Playwright real desktop/mobile no SHA final.
- CLI release:prepare 1.27.109, build reproduzível e 4 browser shards.

## Homologação visual humana ainda obrigatória

1. Inspecionar vídeo/screenshots em fases 1, antes e durante ascensão,
   High/Medium no desktop e celular real.
2. Registrar se o efeito de esteira, prédios atravessando prédios,
   trem atravessando estrutura e elementos flutuantes foi **realmente**
   eliminado, e se a cidade está legível e suficientemente detalhada.
3. Confirmar FPS/oclusão de HUD; rejete a candidata se qualquer P0
   visual persistir. O teste geométrico não garante resultado premium.

## Limitações e próximos cortes

- Parcelamento 2D não resolve todas as possíveis colisões de cenário
  (pilares, skyline decorativo, passarelas e outras camadas da issue #285).
- A malha de tiles clonados permanece. Caso a esteira ainda seja
  perceptível, tratar continuidade/cinematografia e variedade de
  fachadas por tile em um corte seguinte, sem mascarar por velocidade
  artificial ou trocar hitboxes.
- A release integrada #319 permanece em Draft. A QA109 deve ser
  homologada em preview isolado antes de atualizar ou promover o pacote.
