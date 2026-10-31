# Nova Wing City 3.0 — BOOST, Options e cidade verde viva

## P0 — regressão de controles

- Regra final de CSS preserva `#boostTouch` visível e acima de HUD, com foco, pointer events e opacidade mínima próprios. Layout thumb arc da 3.7 preservado.
- Sete botões no arco do polegar direito: TIRO, BOOST, BOMBA, GIRO, ROBÔ, PODS, LOCK (só no mecha); todos com áreas reais de toque >=48px; portrait >=60px para os botões principais. BOOST não desaparece ao alternar para LOCK.
- Orbitar chefe acima do joystick esquerdo com deslocamento proporcional ao tamanho real do controle nos formatos portrait/landscape.
- Evidência: Playwright `city-30-boost-options.spec.mjs`, `mobile-thumb-arcs.spec.mjs` e `boss-thumb-ergonomics.spec.mjs`; revisar S21 fisicamente.

## P0 — cidade premium / Matrix

- Prédios ancorados aos 200 volumes arquitetônicos reais da fase; acrescentar janelas, padrões assimétricos, linhas e recortes por fachada, inclusive **+até 8 janelas básicas por prédio no Médio**.
- Cor dominante verde esmeralda, jade, ciano e grafite; reduzir luz roxa e tornar outdoor e passarelas mais legíveis.
- Regiões danificadas e em reconstrução com janelas apagadas, placas rasgadas, vigas e andaimes; não fingir prédios totalmente destruídos, o dano é uma leitura visual procedural.
- Retângulos antigos passam a apresentar piso, dois guarda-corpos, reforços inferiores e sinalização, reforçando identidade de passarelas. O novo sistema também cria conexões **entre edifícios vizinhos do mesmo lado**, com suportes e painéis de vidro, sem atravessar faixa central de combate.
- Plataformas de pouso junto a edifícios, táxis curtos animados e faróis; no modo Médio densidade reduzida, Alto com mais veículos e janelas.
- Instancing: 8 batches adicionais por tile (16 nos dois tiles); 3 + 3 + 2 grupos para fachadas/sinalização, microjanelas/danos e táxis, sem milhares de Mesh individuais.

## P0 — Options simplificado

- 12 controles e toggles preservados para compatibilidade com as preferências salvas; uma única tela compacta com 4 colunas landscape/desktop e 2 portrait.
- Idioma em select imediatamente visível, sem auto focar/abrir popup do navegador. Labels curtos; linhas de áudio menores; botão FECHAR no mesmo painel.
- Painel sem scroll interno em 320×568, 390×844 e 844×390; automatizar teste de bounding boxes e qualidade da interação.

## QA/limitações

- `npm ci`, format, build, lint, unit, validate e browser shards. Testes locais não substituem o aceite humano.
- Caso exista alguma regressão no real S21, priorizar BOOST e Options antes da promoção; foto/screenshot de comparação de skyline e FPS Médio/Alto.
- Ainda usa assets procedurais otimizados, não um pacote GLB/PBR fotorrealista. Redução do roxo não altera a temática de setores espaciais posteriores deliberadamente.
- PR empilhada sobre Graphics 3.7, **QA isolado e sem promoção à produção**.
