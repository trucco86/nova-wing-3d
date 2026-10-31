# Graphics 3.7 — NOVA-7 e robô premium + Mobile Controls 3.0

## Solicitação
Nave um pouco maior, mais acabamento premium e menos visual simplificado; robô mais detalhado sem perder identidade. Mobile: comandos em arcos de meia-lua, transparentes e com boa ergonomia dos polegares, preservando o gameplay no centro. Validar especialmente no Galaxy S21.

## Visual
- NOVA-7: ampliação do modelo do jogador de 1,05× para **1,11×** (+5,7% sobre a candidata 3.6), raiz física/hitbox/câmera inalteradas. Módulos de modelo do hangar aplicam mesma escala quando trocados.
- Acrescentadas **24 peças pequenas** por instanciamento, em **3 chamadas de desenho** de acabamento: 8 painéis baixos de fuselagem/asa, 10 frisos mecânicos, 6 LEDs embutidos. Preservar bico contínuo, asas e turbinas atuais; sem pods ou carenagens grandes.
- Robô: corrigido bug anterior em `src/visuals.js` que deixava `robot.scale.setScalar(0.99)` dentro de comentário literal. Agora o chassis tem **1,04×** de escala, com variações horizontais proporcionais a cada loadout. Acrescentados painéis de peito/coxa/canela, frisos de serviço e LEDs em **3 batches**; cada antebraço articulado usa **2 batches pequenos** anexados ao seu pivô próprio. Canhões duplos, animação de turbina e VFX de disparo preservados.
- Acabamentos por `InstancedMesh`, reutilizando geometria unitária, materiais e pintura existentes. Não alteram física, dano, hitbox, progressão nem naves inimigas. Melhorias estéticas procedurais, não integração GLB/PBR.

## Mobile Controls 3.0
- Substitui as grades retangulares pesadas por dois polos em arco inferior: **joystick à esquerda**, agrupamento circular de ações à direita. No combate robô, o controle LOCK passa a ocupar uma sétima área própria, sem sobreposição com os outros seis botões.
- Tamanho físico real de áreas de toque de pelo menos **48×48 CSS px** (TIRO com até 61×102 CSS px no portrait); botão mais opaco durante toque. Pintura base ~55% opaca no cenário, 94% ao pressionar. Área clicável **não muda** com a opacidade.
- Tela 320, 360, 390 e 844 (landscape) verificada por Playwright quanto a visibilidade, limites da viewport e ausência de sobreposição de botões/analógico. `env(safe-area-inset-*)` para bordas de aparelhos.
- O indicativo Reflex Boost permanece no botão de impulso. Orbitar chefe continua na zona do polegar esquerdo, logo acima do joystick. HUD permanece no topo.
- Preservado suporte a modo canhoto; verificação humana é necessária para alcance e conforto com mão dominante, sem inferir ergonomia apenas de screenshots.

## Quality gates
- Testes unitários 3D, pintura, dimensões de modelos e integridade do rig; Playwright mobile 320/360/390/844 com 7 botões, central gameplay e screenshot.
- `npm ci`, `format`, `build`, `build:check`, `lint`, `test`, `validate` e browser shards.
- Homologação física no S21: TIRO, BOOST+Reflex, LOCK de precisão, órbita de chefe, analógico, tela de pause, tolerância às bordas e FPS Médio/Alto.
- Antes da liberação: revisar o contraste/opacidade real e se a fuselagem ainda mantém as proporções da referência. Em caso de regressão de FPS, remover microdetalhes das configurações de baixo custo, não esconder a nave.
- **Candidata isolada**, sem merge DEV/HML/PROD até a aprovação humana. A qualidade visual de concept art continua exigindo pipeline GLB/PBR/LOD avançado, tratado em outra iniciativa.
