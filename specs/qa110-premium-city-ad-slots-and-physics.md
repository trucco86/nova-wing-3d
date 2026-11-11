# QA110 | Cidade Premium, publicidade genérica e integridade espacial

## Objetivo e dependência

Evolução visual da fase 1 após correção de sobreposição e continuidade
QA109 (PR #320). Candidata de preview isolado. Nenhuma alteração de
produção é permitida antes de CI FULL, captura visual e aprovação humana.

## Decisões de escopo

1. Criar inventário de mídia decorativo, pronto para receber peças
   futuras sem mudar a geometria nem criar rastreamento ou entrega real
   de anúncios. Anúncios atuais são **genéricos e fictícios**.
2. Tipos: painel de fachada, outdoor sobre telhado com duas bases de
   suporte, banner/faixa horizontal presa a uma parede existente.
   Não pendurar banners soltos sobre corredor de voo.
3. Cada slot expõe `id`, `type`, `creative`, `hostIndex`,
   `surface`, posição, largura e altura. Coordenadas são tile-local.
4. O planejador usa os 200 prédios com zoneamento da QA109 e as 24
   torres distritais. Proíbe qualquer interpenetração 3D do painel e
   suportes com outro prédio ou espaço de anúncio, além de reservar
   x fora do corredor de voo e trilhos.
5. Reservar também fachadas já ocupadas por publicidade City32/City33
   para evitar letreiros sobrepostos visualmente.
6. Materiais-base metálicos, fachadas e vidros devem ter roughness
   menor e highlights mais legíveis, sem aumentar brilho emissivo
   global e comprometer HUD. Manter Alto/Médio e orçamento de GPU.
7. Construir mídias usando InstancedMesh por material ou campanha
   compartilhada, sem criar meshes individuais por painel em todas as
   fachadas. Não criar hitboxes invisíveis para ad decorativo.

## Aceite verificável

- Há slots dos três formatos em **ambos** os tiles da fase 1, sem
  duplicar IDs, entre 7 e 12 por tile, com suporte real.
- Outdoors iniciam sobre a linha superior do telhado, banners e
  painéis estão sobre fachada verdadeira. Suportes não penetram
  prédio vizinho, outro anúncio ou a via do maglev.
- AABBs 3D verificadas. Não mover os edifícios já homologados,
  não impedir a nave de explorar todo o espaço disponível.
- Renderização e gameplay em desktop/mobile sem exceptions, sem
  regressões de controles, HUD, colisores e progressão.
- Testes Node, build reproduzível, `npm run validate` e **quatro
  shards Playwright FULL no SHA final**, mais inspeção humana
  comparando capturas Alto/Médio em desktop e celular.

## Não entregue neste lote

- Integração com ad server, monetização, analytics, dinâmica de
  campanhas, URLs de anunciantes ou painel CMS.
- Auditoria geométrica universal de todo cenário e todas as 10
  fases. O contrato de sobreposição cobre os **novos slots**,
  prédios e torres conhecidas.
- Transformação total da cidade em novo motor visual. Reflexos
  dependem da iluminação existente e da GPU do dispositivo.
- Publicação em produção ou homologação visual humana.

## Ordem posterior

1. Revisar visual do preview QA110 antes de liberar produção.
2. Se ainda houver clipping em props antigos, expandir o mapa
   espacial aos elementos atuais, mantendo os testes QA109.
3. Só então considerar a promoção da cadeia #319 > #320 >
   QA110, com aprovação manual e rollback definido.
