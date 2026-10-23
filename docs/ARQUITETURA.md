# Arquitetura

## Fluxo de execução

`src/main.js` chama `createGame()` de `src/game.js`. A fábrica monta a cena Three.js, interface, controles e ciclo de animação. `src/visuals.js` fornece modelos de naves, cenário procedural e pós-processamento.

O movimento para a frente é simulado pelo deslocamento dos elementos em relação à nave. A nave controla posição horizontal e vertical em uma área limitada. Objetos que passam pelo jogador são removidos ou reposicionados. O cenário usa instâncias para reduzir chamadas de desenho.

## Estado e tempo

O jogo alterna entre menu, partida, pausa e resultado. O ciclo visual utiliza delta de tempo limitado; testes avançam o mesmo código por `step(dt)`. Cada setor possui duração de aproximação de 65 a 90 segundos. Subchefe e rival entram durante esse percurso; o chefe colossal encerra o setor. Após sua morte, uma cena de colapso de oito segundos antecede o hangar, exceto no décimo setor, que conclui a campanha. O dano do chefe passa por uma função comum para tiros e bombas, evitando diferenças no encerramento da vitória.

Escudo, bombas, energia, pontuação e entidades pertencem à instância do jogo. Reiniciar limpa entidades e repõe recursos. Pausa congela a simulação. Perder foco limpa teclas pressionadas e pausa a partida.

## Entradas

Teclado e controles de toque alimentam as mesmas ações. Eventos de cancelamento de ponteiro devem liberar o movimento. A fábrica aceita relógio, gerador aleatório, agendamento e renderer para testar sem GPU. Essas interfaces não expõem mutações do jogo como comandos globais no navegador.

## Renderização

Three.js 0.170.0 permanece fixado para preservar compatibilidade com shaders e materiais já utilizados. Geometrias compartilhadas reduzem alocações entre instâncias de naves. Água, cidade, lua, estrelas e propulsores são procedurais. Bloom acrescenta brilho à composição; não é um motor físico de iluminação.

A verificação estrutural de malhas não substitui renderização real. Erros de shader, enquadramento e legibilidade precisam dos testes no navegador e de revisão visual.

## Interface e áudio

O HTML contém HUD, diálogos e controles; CSS adapta a interface para telas menores. Efeitos sonoros usam Web Audio após interação do usuário. `src/audio.js` contém dez composições adaptadas do original MIT e um tema de chefe. O sequenciador avança com a simulação, limita vozes simultâneas, para na pausa e reutiliza um AudioContext. Música e efeitos têm controles independentes. Fontes externas são opcionais, com fallback CSS.

## Build e distribuição

`tools/build.mjs` usa esbuild para incorporar Three.js e o código do jogo, CSS e retrato WebP em `index.html`. `src/shell.html` contém marcadores de substituição. `build:check` recompõe a saída em memória e compara com o arquivo versionado.

A entrega em um HTML simplifica hospedagem estática. O custo é um bundle gerado grande; agentes devem consultar fontes, não esse arquivo. `tools/build.py combine` é um atalho de compatibilidade. Não existe operação de divisão que reescreva fontes a partir do bundle.

## Dependências

Node 24 é a referência de desenvolvimento. `npm ci` utiliza o lockfile. Atualizações de dependências exigem validar o build e, para Three.js, renderização real. Não há backend nem conta de jogador. Checkpoints locais são validados por `src/campaign.js`; armazenamento indisponível não impede a partida.

## Campanha e chefes

`src/campaign.js` mantém os dez setores, preços e contratos de checkpoint. `src/bosses.js` constrói silhuetas procedurais com duas partes destrutíveis e núcleo. Todos os caminhos de dano passam por `damageBoss`; partes protegem o núcleo até serem destruídas. A câmera mantém os chefes distantes da nave, ocupando grande parte do horizonte.

Os estados incluem `respawning` e `shop`: respawn preserva posição e concede invulnerabilidade; o hangar congela combate e permite compras com saldo verificado. A progressão não permite saltar além do setor final.

## Extensões futuras

Novas fases devem extrair dados de encontros para um módulo próprio antes de multiplicar condicionais. Persistência e música exigem especificações separadas. Mudanças de performance devem trazer medições reproduzíveis com dispositivo, resolução e cenário, sem promessas de FPS baseadas apenas em inspeção.

## Voo e instalações terrestres

`src/flight.js` mantém o rig de perseguição (posição, alvo e inclinação) com suavização exponencial em segundos e colisão varrida esfera/AABB. A câmera desloca mais que o alvo para produzir paralaxe entre estruturas próximas e horizonte; shake não contamina o estado do rig. Pausa congela a câmera, reinício a restaura.

`src/encounters.js` fornece tanques, sentinelas articulados, pórticos, reatores e túnel. Templates compartilham geometrias; cada unidade tem transformações próprias. Caixas de colisão são criadas junto às peças sólidas, mantendo aberturas transitáveis e detecção durante impulso. Apenas setores city/ocean/ice têm defesa terrestre e túnel. A instalação começa aos 24 segundos, atravessa a rota e é removida pela posição da saída; não depende da velocidade do jogador para definir um prazo artificial.

Pressão longa é tratada por CSS (`touch-action`, seleção, callout) e eventos de contexto/seleção/arraste restritos à superfície de jogo. Ponteiros possuem dono por controle, permitindo mover/atirar/impulsionar simultaneamente. Cancelamento, pausa, perda de foco, respawn e mudança de setor liberam os controles.

Chefes continuam usando os mesmos contratos de dano e progressão, com mandíbula, olho, costelas e tentáculos integrados às dez estruturas mecânicas. Alterações visuais não alteram geradores nem a ordem de exposição do núcleo.

## Espetáculo e combate (1.2)

`src/combat.js` controla chegada protegida, orçamento de dano em segundos, vida e três fases. Todos os tiros e bombas usam esse orçamento; armas máximas continuam úteis, mas não eliminam um chefe em segundos. O núcleo alterna cinco segundos exposto e dois protegido. A fase final acelera ataques e trilha; o conjunto máximo de armas não concede mais imunidade permanente a projéteis.

O subchefe usa um cruzador próprio e se mantém em z=-85 até ser derrotado. Duas bombas vencem o primeiro; outros setores escalam resistência. O túnel aguarda o cruzador, e o chefe aguarda a saída do túnel. A missão pode durar mais que a aproximação nominal caso esses encontros ainda estejam ativos.

`src/equipment.js` compartilha templates de pods e anéis: verde/cruz para escudo, azul/setas para arma. Pods evoluem nos níveis I–III, alterando carcaça, cadência e formação, e preservam mira elevada em alvos terrestres. `src/finale.js` produz a onda de choque e destroços. O estado `collapsing` bloqueia dano e só concede a recompensa uma vez, ao final; na web, movimento, impulso e tiro continuam ativos durante o colapso; pausa guarda o estado anterior.

O sequenciador possui seis estados musicais e arranjos com harmonia, baixo, melodia e percussão sintetizada; filtro e compressor controlam o espectro e a soma das vozes. Destruição libera os nós. Fixtures gráficas e de áudio não são distribuídas no Pages.

## Voo e Force (1.3)

Anéis derivam sua faixa de spawn do limite horizontal da nave, inclusive após resize, e usam cruzamento varrido em Z e atração de curta distância. O voo mantém os limites anteriores; evita-se posicionar recompensas fora deles.

Pods têm estados `docked`, `launching`, `deployed` e `returning`. A posição solta permanece no mundo; o retorno usa velocidade limitada por delta. Projéteis hostis usam colisão varrida com os pods antes da nave. Acoplados acompanham o comando de tiro; lançados disparam em leque automaticamente. V e toque executam a mesma transição; pausa impede mudanças.

`encounterPattern` define dez assinaturas de ataque usadas por chefe e subchefe do setor, com pressão por fase. Templates de subchefes são compartilhados por variante; a anatomia dos chefes varia em proporção, membros, olhos, cristas e membranas, além das carcaças existentes. Geradores e núcleo preservam as zonas de acerto.

## Entrada e apresentação (1.4)

`src/input.js` agrupa as teclas reconhecidas e a proteção de gestos do navegador, retornando cleanup dos listeners. A instância de jogo continua dona das ações e do estado. Keydown e keyup são consumidos para teclas do jogo em missão; modificadores do navegador não disparam ações. O canvas recebe foco ao iniciar. Listeners de toque não passivos protegem a superfície de jogo, e seleção/contextmenu em HUD são cancelados durante a missão.

A capa contém título, frase, iniciar/continuar e ajuda em `details`; HUD de combate fica invisível no menu. A nave apresentada é o próprio modelo 3D. A matriz [de contratos](../specs/README.md) e o [mapa de edição](REPOSITORIO.md) conectam esta organização aos testes e ferramentas.

## Android (1.5)

`src/native.js` conecta App/SystemBars do Capacitor à mesma instância do jogo. `setActive(false)` libera comandos, pausa combate/respawn/colapso e suspende Web Audio; `setActive(true)` não retoma a missão. No aplicativo, eventos nativos controlam atividade e eventos de foco/visibilidade web não podem reativá-la. Back pausa antes de minimizar. A retomada pelo jogador reutiliza o AudioContext.

`tools/android.mjs` recompõe o jogo, remove a fonte externa opcional e sincroniza assets/plugins para o projeto Gradle em `android/`. Esses assets, caches e builds são ignorados pelo git e pelo digest de validação. O wrapper é versionado; a versão do aplicativo vem de `package.json`. A CI compila APK debug e AAB sem assinatura. A interface Android ganha um bloco de contenção com insets CSS fornecidos por SystemBars; a cena continua ocupando a tela inteira. Veja [Android](ANDROID.md) para construção e limitações físicas.

## iOS

`tools/ios.mjs` compartilha o bundle offline com Android, sincroniza o projeto Swift Package Manager e alinha a versão Xcode. `installNativeShell` compartilha pausa/retorno entre as duas plataformas; Voltar e minimizar permanecem exclusivos do Android. As classes nativas usam a mesma área segura. O CI macOS compila e inicia o app em simulador, sem assinatura de distribuição.

## Voo dinâmico (web em validação)

`route.js` aplica a mesma deformação por profundidade à projeção de malhas, instâncias, linhas, sprites e terreno da rota. Colisões continuam no referencial local; a câmera inclina suavemente e a rota se alinha antes do chefe. Céu e buraco negro são referências distantes. O terreno web tem subdivisões para curvar; o nativo mantém o original. Materiais de projeção são isolados por instância e liberados quando deixam a cena. Não há mudança para voo livre.

`arcade.js` mantém a simulação 2D lateral de 18 segundos; `game.js` coordena a interrupção aos oito segundos nos setores 3 e 7, congela a campanha e credita o resultado uma vez no retorno. O estado `arcade` participa de pausa, foco, toque e liberação de comandos. A renderização 2D usa canvas em coordenadas virtuais independentes da resolução.

`customization.js` valida cinco pinturas, propriedade, preço e limiares de acertos. O checkpoint v1 aceita os campos opcionais `cosmetics` e `score`, preservando a leitura de saves antigos. A pintura usa materiais exclusivos do jogador; não altera inimigos nem atributos. `nativeLifecycle` desativa rota, cenário ampliado, desafios e loja de pinturas nos apps. A fixture acelerada `tests/dynamic-scene.js` é servida exclusivamente com NOVA_VISUAL_TEST=1 e não vai ao Pages.

## Câmeras web (1.7)

`flight.js` mantém o rig nativo original e um rig web com zona de enquadramento, acompanhamento por tempo e três modos. Limites da missão web são x ±72 e y -1..46, independentes da proporção da tela; a câmera adapta o enquadramento ao aspect. `cockpit.js` cria uma estrutura presa à câmera, excluída da deformação da rota, com materiais e geometrias liberados ao destruir a instância. Casco externo é ocultado no cockpit, sem remover posição, projéteis ou colisões. Colapso usa vista distante e o setor seguinte restaura a escolha do jogador. C e botão chamam a mesma transição, bloqueada fora da partida ativa.

## Combate estratégico web (1.8)

`strategy.js` define limiares XP, arsenal, especiais, fraquezas e validação dos
campos opcionais de checkpoint. `evolution.js` compartilha templates de módulos
visuais; evolução não amplia hitbox. `game.js` aplica efeitos por delta de tempo,
energia arcana, cadência e perseguição dos pods. Estados novos são reiniciados
com a campanha, congelados na pausa e desativados por `nativeLifecycle`.

A arena usa o referencial do jogador: órbita transforma cenário, chefe e projéteis já
em voo em torno do centro; pontos de acerto vêm das matrizes mundiais das malhas.
J/L e botões laterais orbitam, enquanto movimento tradicional ajusta a mira.
Geradores nos flancos e núcleo frontal compartilham o orçamento de dano existente.
Bombas respeitam os ângulos e proteção. O cenário para de avançar durante a arena.
Testes usam entrada de órbita antes do dano; não ignoram a proteção de posição.

## Hangar web (1.13)

`showroom.js` instala uma visualização Three.js isolada da simulação, ativada somente na seleção visível. Observa os IDs de piloto, nave e cor publicados pela seleção; não cria comandos globais nem muda o checkpoint. `showroom-models.js` cria esculturas dos gatos e clona recursos dos modelos reais de nave para descarte independente. O destroy da aplicação libera renderer, observers e listeners. Recortes CSS compartilham a única capa incorporada; não há download de modelos externos.

## Subchefes táticos web (1.20)

`subboss-tactics.js` mantém dez perfis puros de aproximação, movimento, cadência,
mira, projétil e preparação. `game.js` aplica esses perfis somente no voo web; o
caminho nativo conserva movimento, dano e cadência anteriores. As silhuetas e os
padrões de projéteis permanecem em `bosses.js`.

O movimento deriva da idade do encontro, sem integração acumulativa dependente de
quadros. O HUD e o brilho do canhão compartilham a mesma janela de preparação. As
fases alteram pressão, mas não HP, fraquezas, recompensas, bloqueio do túnel nem o
limite global de projéteis.

## Acesso rápido ao RPG web (1.22)

`strategy.js` deriva uma descrição dos bônus efetivos e o próximo desbloqueio a partir
do mesmo XP e especialidade usados pelo combate. `game.js` apenas projeta esse estado no
HUD: arma, especial e ativação permanecem acessíveis fora da gaveta; detalhes e ações
táticas continuam recolhidos na lateral. Não existe estado duplicado de equipamento.

Os botões de troca ficam desabilitados enquanto houver uma única opção desbloqueada.
Teclas F/H/G, toque, limiares, custos, checkpoint e fórmulas de combate não mudam. O
layout retrato coloca a ativação em uma linha própria; o nativo preserva a interface
anterior porque os controles estratégicos continuam condicionados ao voo web.
