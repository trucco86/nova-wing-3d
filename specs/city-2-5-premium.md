# Cidade das Máquinas 2.5 — polish premium integrado

## Problemas observados no gameplay
- O trilho suspenso estava parecendo uma viga simples, sem infraestrutura de sustentação convincente.
- O trem existia, mas não aparecia em um momento de gameplay fácil de reconhecer.
- Os edifícios não tinham publicidade visual e marcas urbanas, e o solo tinha poucas superfícies em relevo.
- A referência 2D premium permanece um **alvo de direção de arte**, não uma representação de assets 3D já aprovados.

## Correções P0 implementadas na candidata
- **Monotrilho estrutural**: sobreposição da via suspensa existente com um guia robusto de 17 unidades, viga inferior, tirantes laterais, bordas de luz ciano e pilares a intervalos regulares; vias nos dois lados a x=±80. Trilho e suportes visíveis em Médio e Alto.
- **Trem reconhecível**: três vagões, 90 unidades de comprimento total, carroceria metalizada, janelas escuras, perfis luminosos, frontal e lanternas. O trem direito permanece visível no Médio. Sua primeira passagem começa próximo a z=-235 e progride durante o voo; trem esquerdo adiciona tráfego no Alto.
- **Outdoors**: seis painéis luminosos orientados para o piloto, com nomes fictícios AERORAIL, NOVA GRID, SKYPORT, ORBITAL, NOVA WING e HYPERLINK, gerados em CanvasTexture localmente e sem downloads. No ambiente Node, fallback mínimo permite testar a composição.
- **Piso premium**: 760 chapas 3D segmentadas por tile urbano, 380 faixas luminosas e acabamentos secundários com variação controlada de metal. Mantém os corrimãos, o piso procedural e as passarelas anteriores.
- **Escalabilidade**: três distritos e skyline da Cidade 2.4 preservados; seis novos InstancedMesh por tile para pista e monotrilho. O High acrescenta detalhes finos na pista, outro trem e maior densidade de tráfego.
- **Jogabilidade**: elementos novos sem hitboxes nem danos, não podem bloquear a nave. Infraestrutura, vagões e outdoors só são visíveis na cidade e saem junto com o cenário durante a transição para a órbita.

## Testes e homologação
1. Confirmar que o trem direito aparece claramente durante os primeiros segundos da fase. O requisito é **percepção no gameplay**, não apenas existência do modelo no grafo Three.js.
2. Confirmar que o trilho tem deck largo, suporte vertical, luzes e alinhamento com trem e plataforma.
3. Comparar chão 3D com referência: painéis de metal com separações, linhas energizadas e visibilidade do corredor.
4. Validar que os outdoors são legíveis, orientados para a câmera e não cobrem HUD, mira ou rota.
5. Executar quality, testes unitários, browser desktop/mobile, teste de três ciclos urbanos e subida orbital.
6. Medir FPS, p95 frame-time e memória no celular e desktop (alvos de referência: 30/60 FPS, ainda não medidos).
7. Fazer screenshots High/Medium em 1366×768 e 844×390 e comparação com imagem de direção de arte; nenhum deploy em produção sem aceite humano.
8. Não confundir a renderização aspiracional da imagem com a qualidade atual: o cenário continua procedural e precisa de assets glTF, materiais PBR texturizados, iluminação global e LOD para atingir visual cinematográfico comparável.

## Próximos refinamentos após revisão visual
- Curvas e entradas de estação do maglev, com paradas e embarque.
- Variedade dos outdoors, animações controladas, iluminação das vitrines e fachada PBR.
- Piso com normal/roughness maps reais e reflexos de baixa resolução compatíveis com WebGL/Mobile.
- LOD por zona, instancing adicional de janelas e validação de desempenho por dispositivo.
