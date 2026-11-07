# QA v1.27.103 | Fase 3: entrada cinematográfica, navegação apertada e detalhamento posterior dos chefes

**Status:** especificação aprovada para implementação em branches isolados e pull requests de QA; **nenhuma implementação de gameplay ou release foi realizada nesta branch**.

**Baseline:** `feat/qa102-premium-city-life-20261107`, commit `4889d40894262c72edddcfaadc402d4955e17277`; CI FULL aprovada. Essa branch é a base acumulada das QA99-102; não partir de `main`, que pode estar defasada.

## Objetivo artístico

A imagem-conceito premium aprovada anteriormente pelo usuário é a referência visual de densidade, acabamento, iluminação e composição. O arquivo dessa imagem **não está versionado no repositório** no estado da baseline. Não inventar que o Codex tem acesso à referência ou substituir por uma imagem aleatória. Na ausência do arquivo de referência, usar a direção já registrada aqui e anexar as capturas atuais do jogo como antes/depois; solicitar o arquivo apenas antes de uma decisão de fidelidade visual exata.

Preservar os elementos e chefes da fase 3 já aprovados; ampliar identidade e detalhe sem desfigurar o chefe. Referências de feeling: Panzer Dragoon/Star Fox para sensação de corredor e esquiva; não copiar assets de propriedade de terceiros.

## P0-A | Entrada real no asteroide

**Código relevante:** `src/asteroid-interior.js`, `src/stage-journey.js`, `src/game.js`, `tests/asteroid-entry-cinematic.test.mjs`, `tests/browser/asteroid-journey.spec.mjs`.

Hoje a abertura é modelada por 56 rochas instanciadas, mas o túnel inteiro fica visível assim que `setPhase('transition')` é chamado. A boca segue interpolação temporal até z=55 e a seção interna se move em paralelo, o que pode causar troca de escala, salto de composição e sensação de teleporte visual.

**Resultado esperado:**
1. Aproximação progressiva à massa do asteroide e à fenda irregular: manter a rocha externa visível até a câmera/nave atravessar a boca, sem pop-in nem relâmpago de cor.
2. Zona de profundidade intermediária conectada geometricamente à fenda: volumes da borda, taludes de rocha, sombras, poeira mineral, reflexos/veios de cristais e variação de materiais entre exterior e interior.
3. Entrada em etapas perceptíveis (exterior→limiar→garganta→caverna), mas pilotagem não pausa e não troca a câmera sem motivo. Criar transição espacial coerente com speed/elapsed, não somente mostrar/ocultar grupos inteiros.
4. A geometria nunca deve cobrir a nave/câmera por placas opacas ou piscar ao cruzar o limiar; culling/transparência ou posicionamento precisam ser verificados no browser.
5. Manter controle completo de direcional/tiro/boost, pause/reset/replay, chegada ao chefe e saída da caverna. Sem flash de HUD e sem textos excessivos.
6. Custo gráfico: instancing e pool; permitir menos partículas/volumes no Médio; evitar geometria e materiais novos por frame.

**Aceite:** 4 screenshots reais da mesma sequência no desktop e mobile (aproximação, boca, limiar, interior), sem teleporte e com câmera e nave visíveis. Testes determinísticos para `reset()`, dt=0/pausa, passagem por fases e boss gating.

## P0-B | Trecho de precisão: pressionar e segurar giro

**Código relevante:** `src/game.js` (`rollHeld`, `heldBankAngle`, player movement e `asteroidInterior.constrain`), `src/asteroid-interior.js`, touch `rollTouch`, `tests/asteroid-interior.test.mjs`.

**Definição de design:** o jogador deve precisar reduzir a largura projetada da nave com o **giro pressionado e mantido**, orientando com direcional para atravessar **ao menos um** estreitamento. Isso NÃO é o giro completo de um toque curto e não deve ser confundido com dash do robô. Um trecho posterior deve permitir desviar de rochas/espinhos em múltiplas rotas, sem tornar todo o túnel estreito ou tirar a liberdade de pilotagem.

**Requisitos funcionais:**
- O espaço seguro, o visual do vão e seu colisor vêm da **mesma definição de geometria**. Nada de obstáculos apenas decorativos na trajetória, caixa invisível larga, túnel circular rígido que impeça ir ao limite permitido onde visualmente exista espaço, ou colisão no cenário ausente.
- Integrar hitbox real da nave à orientação visual durante `rollHeld` (OBB ou cálculo de projeção do casco). O giro altera a ocupação lateral apenas de forma fisicamente fundamentada, sem criar invulnerabilidade ou reduzir o collider arbitrariamente. Robô/dash precisa ter regras explícitas de largura e forma.
- Ao encostar em saliências e espinhos: colisão com resposta clara, empurrão/limite físico localizado, efeito de impacto e dano compatível com cooldown, não teleporte entre paredes, atravessamento ou dano repetido por frame. `Boost` não atravessa rocha.
- Posicionar estreitamentos e rotas alternativas com sinais visuais claros e tempo de antecipação; evitar pop-in de pedras. Desenho de dificuldade progressiva: primeiro ensina estreitamento, depois alterna obstáculos/esquivas, depois abre arena.
- Segurar `Q/E/Z` (teclado) ou o botão GIRO (mobile) e soltar volta suavemente ao perfil normal; tocar rapidamente continua acionando roll 360. Não bloquear boost/tiro, não deixar input preso após pausa/blur/pointercancel.
- Se o usuário colidir ou ficar parado na garganta, permitir recuperação sem softlock. Não alterar campanha de outras fases, principalmente fases 1 e 2.

**Aceite:** testes de trajetória em 30/60/120 Hz; com rollHeld atravessa seção própria, sem rollHeld o casco toca a borda; colisão em obstáculos de rocha provoca reação real; controle mobile multitouch funciona; pause/resume/reset determinísticos. Screenshots de aproximação, passagem de lado, fragmentos e saída em ambos formatos.

## P0-C | Rocha solta, espinhos e ambientação da caverna

- Misturar rocha negra, mineral escavado, fragmentos com diferentes contornos, detritos que cruzam o trajeto e saliências de teto/parede/piso que realmente possam ser evitadas.
- Elementos físicos acompanham matriz e visibilidade real da malha; colisão contínua para detritos rápidos, não apenas posição final de frame.
- Não enterrar pedras no piso/parede nem apresentar pedras flutuando sem narrativa de gravidade reduzida no interior; manter leitura do espaço.
- Volume e frequência variam com trecho e qualidade gráfica: sem repetição óbvia em anéis idênticos.
- Preservar lock-on múltiplo da fase 3, hit feedback e chefe.

## P0-D | Traseira de todos os chefes (especial atenção ao chefe 3)

**Código relevante:** `src/boss-visual-identity.js`, `src/boss-kinetic-details.js`, `src/bosses.js`, `tests/boss-kinetic-details.test.mjs`, `tests/boss-hardpoints.test.mjs`.

- Modelagem coerente em 360 graus: blindagem segmentada, radiadores, motores/turbinas, cabos embutidos, válvulas, placas articuladas, suportes de armas e luzes de manutenção, com identidade própria para 10 chefes. Não apenas colar grelhas iguais nos dez.
- Chefe 3 deve enfatizar brocas/coroas mecânicas, engrenagens e coletor de rejeitos na traseira; não reduzir o destaque do modelo/chefe atualmente aprovado.
- Elementos traseiros mudam sutilmente com ataque/estado do chefe e podem degradar visualmente quando a parte real associada estiver destruída; se vincular a hitpoints, usar estado existente, sem falsificar dano.
- Nunca deslocar pontos fracos, canhões/muzzles, weakpoint rings, sensores, roteamento de tiros ou hitboxes aprovados. Se algum novo ponto fraco for proposto, exigir desenho + aceitação separada.
- Criar pelo menos duas capturas por chefe (frente e trás), e capturas em combate orbitar para os chefes que o suportam, evitando face vazia ao jogador chegar atrás.
- FPS/custo: instancing, materiais já compartilhados e shader warm-up existente; reciclar/dispor geometrias de forma correta.

## P1 | Consistência premium demais fases

Documentar uma checklist separada por tema: Marte (poeira/alien), interior da nave-mãe, Sol, Europa, Hydra, Saturno/anéis, gravidade, Marvin; não aplicar a mesma paleta ou objetos em todos. Cada fase recebe revisão visual e física isolada. Não implementar os 10 setores no mesmo PR.

## Estrutura de execução no Codex

Criar três worktrees/branches independentes a partir da baseline QA102:
1. `codex/qa103-asteroid-entry`: P0-A, módulo de entrada, snapshots, quatro checkpoints.
2. `codex/qa103-asteroid-obstacle-roll`: P0-B+C, geometria física, rochas e mecânica de hold-giro, desktop/mobile.
3. `codex/qa103-boss-rear`: P0-D, modelagem traseira e animações vinculadas a estado real, sem modificar hitbox.
O integrador revisa conflitos em `src/asteroid-interior.js` e `src/game.js`, funde os PRs **somente em uma branch QA** e atualiza versão e HTML uma única vez via `npm run release:prepare -- 1.27.103` antes de alterar src (ou conforme fluxo de release aprovado). Não misturar merges individuais em produção.

**Gates obrigatórios:** `npm ci`, `npm run format`, `npm run build`, `npm run validate`, `npm run validate -- --browser`, todos os quatro shards e inspeção manual das capturas desktop/mobile. Aplicar `docs/QA-AGENT.md`, sem enfraquecer testes existentes. Manter PR draft até homologação.
