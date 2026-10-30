# Histórico

## 1.27.23 — Boss Adaptive Counterplay (candidata QA)

- Marvin e Hidra passam a reagir à altura real de voo, boost e posição orbital do jogador no instante do telegraph.
- Tentáculos interceptam o piloto em altitude, garras respondem ao flanco/robô, e Marvin alterna a pressão frontal na fase 3 sem eliminar as janelas de ataque à distância.
- O alvo é fixado no início do aviso; desviar da área indicada continua evitando o golpe, sem retarget invisível ou golpes aleatórios.
- Testes determinísticos validam seleção, altura, hitbox, esquiva, comportamento em robô e fase 3.
- Isolado em QA sobre PR #168; sem mudanças em DEV oficial, HML ou produção. Home e retratos permanecem backlog separado.


## 1.27.22 — Mecha Heavy Fire (candidata isolada QA)

- Nave mantém agilidade e a cadência original; robô recebe 2,35× no dano por disparo com intervalo 20% maior entre tiros (DPS ~1,96× na mesma arma).
- Tiro carregado do robô recebe 2,1×; precisão do braço esquerdo aplica 7× dano base mantendo trava, custo de energia e cooldown.
- Projétil pesado 1,6× maior, recuo e flash de saída, impactos mais evidentes e efeitos sonoros próprios para tiros, precisão e colisões. O disparo carregado nasce do canhão do punho direito (não do centro da nave), com escala reforçada e teste real de teclado/toque.
- Respeita colisões e armadura/pontos fracos dos chefes; nenhuma alteração na pontuação, ranking, saves, login ou nave.
- QA isolada baseada no PR #167; sem integração em DEV/HML/prod antes de CI e avaliação visual/sonora humana.

## 1.27.21 — Console Start & Three-Menu Hub (candidata QA)

- Capa original Web centralizada, com PRESS START como único comando inicial e sem rolagem de configurações.
- Segunda tela apresenta apenas JOGAR, HANGAR e CENTRAL; recursos antigos preservados e organizados em submenus.
- JOGAR: início de missão, checkpoint e abertura; HANGAR: seleção e inspeção 360°; CENTRAL: opções, músicas, Google, patentes, troféus, ranking e QA.
- Teclado Enter abre o primeiro menu em vez de pular a tela de título; Escape volta do submenu.
- Interface responsiva, touch target >=44px, sem duplicar lógica de save/ranking/autenticação.
- Isolada sobre PR #160; revisão visual e Playwright obrigatórios antes de DEV/HML/PROD.

## 1.27.20 — Patentes e Condecorações Five Cats (candidata QA)

- Dez patentes e cinco uniformes por piloto, cada um com pontos de serviço independentes.
- Medalhas felinas e insígnias em formato de gato com origens verificáveis nas missões.
- Hall da Patrulha com cinco fichas, graduação coletiva e evolução de uniforme 3D no hangar.
- Notificação pós-fase de promoções/medalhas; no gameplay normal, não altera dano, velocidade nem ranking.
- Baseada na PR de troféus #159; HML e produção não alterados.

## 1.27.19 — Troféus Five Cats (candidata em QA)

- 41 conquistas com raridades Bronze/Prata/Ouro/Platina; ranking e moedas permanecem independentes.
- Conquistas por chefe, recorde real, pontuação, dano, armas primárias, dificuldade, robô e equipe.
- Hall da Fama no menu, pop-up de desbloqueio no HUD superior e progresso offline local versionado.
- Sem recompensas em sessões de QA/dev; testes Playwright e localização obrigatórios antes de DEV.

## 1.27.14 — Dez formações táticas por setor (candidata)

- Adiciona dez programas de ondas de caças por destino, variando papéis, entradas e posicionamentos.
- Preserva cadência, quantidade e dano dos inimigos e o controle contextual da câmera.
- Candidata de QA isolada, sem promoção de DEV/HML/PROD.

## 1.27.13 — Radar de esquiva com hitbox real (candidata isolada)

- Radar dos chefes mostra origem do golpe, área vermelha de colisão física e rota até uma posição segura.
- Aviso contextual não acompanha a nave após fixar o alvo, permitindo desviar ou manter uma posição fora do golpe.
- Radar de projéteis permanece angular; nenhum falso indicador de segurança para disparos não determinísticos.
- Guia acessível no HUD superior direito, sem bloquear o gameplay, com regressão mobile retrato/paisagem.
- PR integrada sem mudanças em DEV, HML ou produção, aguardando CI e homologação humana.

## 1.27.12 — Candidata integrada Boss AI e Órbita-9 (QA)

- Código combinado: dez chefes com assinatura visual, IA de golpes físicos telegráficos e esquiva real.
- RPG: Plasma Titan 8 s, Five Cats Overdrive 10 s, Barreira 12 s, Estase 11 s, dano metrado separadamente.
- Câmera superior contextual com controles X/Z, missão Reator Órbita-9 e exploração 3D experimental com três pistas e NPC.
- Mobile: canvas e botões em camadas distintas, testes reais de hit-testing de controles.
- CI e homologação humana pendentes na candidata; DEV, HML e produção permanecem intactos.

## 1.27.11 — Preview integrado de campanha e exploração (candidata QA)

- Reúne as mudanças de cenário/câmera da v1.27.6 e os dez padrões de chefes das candidatas v1.27.7/v1.27.8.
- Adiciona o protótipo de investigação da Órbita-9 da v1.27.10 com domínio de quest v1.27.9, limitado a Developer/QA.
- Branch de integração experimental; progresso da campanha, ranking, HML e produção preservados.

## 1.27.8 — Dez chefes com assinaturas de combate (candidata isolada)

- Rok, Ferrão, Fortaleza Órbita, Fênix, Ômega e Bastião ganham ataque posicional próprio, animação de peça e reação à destruição de baterias.
- Combinados à v1.27.7, todos os dez chefes têm padrão especial de ataque, sem retirar a mecânica de flancos e núcleos.
- Testes de emissões, duração, número de projéteis e movimento de peças visuais.
- Não inclui mundo aberto nem ataques físicos de arena; HML/PROD inalterados.

## 1.27.7 — Ataques exclusivos de chefes (candidata isolada)

- Perfurador, Colosso Glacial, Hidra e Marvin com poses e salvas especiais; armas/baterias variam conforme geradores destruídos.
- Ataques partem de peças visuais da nave/robô e os avisos permanecem na faixa superior do HUD.
- Testes de assinatura, animação, intensidade por fase e simulação real.
- Scope limitado aos quatro chefes; mundo aberto e danos por membros individuais continuam no backlog.

## 1.27.6 — Cenários, perspectiva e chefes diferenciados (candidata DEV)

- Terra e satélite contextualizados na ascensão; lua rachada exclusiva do cinturão de destroços, lua de gelo sem fissuras; ambientação temática de plasma, nebulosa, frota, vazio e fortaleza.
- Mudanças curtas de câmera lateral, superior e plano aberto por fase, sem substituir escolha manual.
- Chefes mais resistentes, carcaça com dano reduzido, marcadores fracos visíveis e multiplicadores para gerador/núcleo.
- Dez perfis de ataque com origens e cadência diversas por fase; robôs gigantes articulados e móveis.
- Projeto de exploração RPG/mundo aberto Five Cats Universe documentado; ainda não implementado.
- Candidata isolada, sem homologação humana; HML/PROD inalterados.

## 1.27.5 — Developer QA e configuração de missão (candidata DEV)

- Painel de testes por setor, com entrada no início, subchefe ou chefe principal das dez fases.
- Guardrails por hostname: ativo somente em DEV, preview de PR e localhost; nativo, HML e produção não exibem ferramentas de QA.
- Sessões QA isoladas: bloqueiam salvamento de checkpoint e envio de pontuação ao ranking.
- Piloto e nave agrupados dentro da ação de missão na capa, preservando hangar e jogabilidade.
- Testes de scenario jump, proteção de dados, seleção mobile/desktop e fluxo de reinício; exige homologação visual/funcional humana.
- HML e produção não alterados.

## 1.27.4 — Som da turbina do robô mais discreto (candidata DEV)

- Substitui o zumbido serrilhado contínuo por uma base mais grave e suave, quase silenciosa em voo normal.
- Reage às manobras e ao BOOST, que mantém presença sonora sem competir com a trilha do jogo.
- Pausa, alternância de nave e mudo de efeitos desligam imediatamente o som contínuo.
- Preserva a música, os outros efeitos, os controles, a jogabilidade e as evoluções anteriores.
- Candidata DEV sem homologação auditiva em smartphone; HML e produção não alterados.

## 1.27.3 — Correção do menu em paisagem (candidata DEV)

- Corrige rolagem vertical e acesso à preparação do esquadrão em modo paisagem de baixa altura.
- Substitui expectativa de botão de 300px por igualdade de largura responsiva entre ações.
- Acrescenta regressão de alcance e clique no botão de preparação em 844×390.
- Preserva ranking, Google login, trilha de ação e os demais recursos da v1.27.2.
- Candidata ainda não homologada; não altera HML nem produção.

## 1.27.2 — Menu centralizado e ranking após Como jogar (candidata DEV)

- Botões da tela inicial centralizados e padronizados em altura, largura e espaçamento, com alvos touch consistentes.
- Ranking integrado abaixo de Como jogar, mantendo histórico local, ranking experimental e controles de privacidade.
- Login social Google e trilha de ação energizada da v1.27.1 preservados, sem mudanças nas configurações Firebase/D1.
- Build reproduzível e regressões de menu para celular e desktop; testes de navegador e aceite humano obrigatórios antes de homologação.
- Candidata somente para DEV; HML e produção permanecem inalterados.

## 1.27.1 — Login social Google no menu e trilha com adrenalina (candidata DEV)

- Login social Google integrado ao fluxo do menu, abaixo de Iniciar/Opções/Trilha/Abertura, sem overlay fixo ou colisões com o RANK.
- Botão de autenticação identificado, estado de conta visível e textos traduzidos em PT/EN/ES, mantendo modo visitante.
- Setores acelerados a 130–154 BPM; boss 150, enraged 164 e colapso 168, com novo ritmo de bateria, ostinatos e frases melódicas mais presentes, preservando subgrave e volume ajustável.
- 289 testes unitários aprovados e build reproduzível; regressão de posicionamento em três resoluções para Playwright.
- Candidata DEV sem alteração de Firebase/D1, HML ou PROD; exige CI browser completa e avaliação auditiva/visual humana.

## 1.27.0 — Integração unificada DEV (candidata)

- HUD mobile P0, prioridade de avisos e controles protegidos; satélite orbital, chegada do chefe pela nave-mãe e melhoria visual dos caças.
- Mecha angular com asa compartilhada, neon progressivo, turbinas animadas e som reativo, duas mãos independentes, lock-on e recoil.
- Formação de cinco naves liderada por Bia, aliados, plasma e especial Five Cats Overdrive.
- Trilha e efeitos cinematográficos originais; transições de fase, caverna 3D e boss gate do mega-asteroide no setor 3.
- Histórico local de vitórias e derrotas, sem dependência de Firebase/D1; nenhuma gravação remota do ranking habilitada.
- Integração passou em 286 testes unitários, lint, formato e build reproduzível. Testes de navegador e aceite mobile ainda requeridos; versão não publicada em HML/PROD.

## 1.24.26 — Hierarquia de alertas no HUD mobile (P0)

- Aviso de vida crítica prevalece sobre ataque iminente, escudo baixo, aproximação de chefe, coleta e rádio em telas touch.
- Informações de menor prioridade voltam automaticamente quando o risco principal termina, preservando os estados internos.
- Teste de estresse Playwright cobre 320×568, 390×844 e 844×390, segurança da área central e acesso aos botões de ataque, impulso, bomba e robô.
- Sem alterações de gameplay, ranking, autenticação, produção ou salvamento; candidata requer CI completa e homologação visual.

## 1.24.24 — Conta e ranking multilíngues (candidata)

- Arranjos originais com andamento mais contido, pads sustentados, percussão de ruído filtrado, tambores graves e mixagem estéreo.
- Transformação e retorno com servo/travas/impacto, turbina contínua responsiva ao robô e BOOST, ignição, impactos na nave e explosões com textura própria.
- Buffers reutilizados, vozes limitadas, prioridade para alertas/impactos, pausa e controles de volume preservados; renderização real de áudio em CI para análise e audição.
- Candidata conjunta de Mecha/armas/paletas/áudio; métricas técnicas não equivalem a homologação estética ou audição humana.

## 1.25.0 — Mecha 2.0: integração limpa para validação

- Candidata sem homologação visual: armadura angular, asas, turbina dorsal articulada e pintura por nave.
- Propulsão contínua por dt, boost touch e movimentação de braços/pernas.
- Testes automatizados de rig e preview separados de mudanças do HUD e arsenal.
- **Não publicar em produção sem QA visual e desempenho.**

## 1.24.20 — Candidata em preparação

- Candidata não homologada; preencher entregas e evidências antes da publicação.

## 1.24.18 — Arsenal do hangar e rota da campanha

- Hangar com dois níveis de multitiro e cadência, bombas individuais e pacote ×3 com teto de oito na web.
- Mapa de progresso entre fases, briefing da próxima missão e retorno ao hangar antes de lançar.
- Checkpoint v1 preservado, sem duplicar reabastecimento ao retomar; textos novos em PT/EN/ES.
- Preserva a órbita acima do direcional esquerdo da v1.24.17.

## 1.24.17 — Briefing e rádio sem colisão no mobile

- Briefing de setor e comunicação da piloto alternam na faixa superior.
- O rádio retém a mensagem real até poder ser exibida, sem consumir seu tempo
  durante o briefing; pausa, reinício, desktop e nativos preservados.
- Avisos críticos têm precedência e o centro do voo permanece livre.
- Órbita do chefe no lado esquerdo, imediatamente acima do direcional, com
  composição compacta em telas de 320 px.

## 1.24.16 — Consolidação P0 mobile

- Unifica analógico responsivo de até 128 px, órbita pelo polegar direito, radar compacto, HUD
  periférico, pausa acessível e auditoria opcional de FPS.
- Reserva a faixa superior para os comandos rápidos do RPG, sem ocultá-los ao abrir
  os detalhes táticos e sem ocupar o corredor central do combate.
- Mantém dificuldade, missão estendida, ascensão por BOOST e retirada do subchefe;
  aceite do mantenedor recebido, promoção condicionada aos gates técnicos finais.

## 1.24.14 — Candidata em preparação

- Candidata não homologada; preencher entregas e evidências antes da publicação.

## 1.24.13 — Medição local de FPS na pausa (DEV)

- Novo diagnóstico opt-in de cadência de frames em celular/PC: FPS médio, p95, quadros lentos e tempo válido.
- Não coloca overlays durante jogo, não envia nem salva dados; relatório é copiado somente após gesto do jogador.
- Desconsidera pausa e suspensão do SO, mantém buffer limitado e informa que não mede o tempo da GPU.
- Interface PT/EN/ES; homologação no aparelho real, Playwright e revisão das dependências pendentes.

## 1.24.12 — Controles orbitais à direita + radar no topo (DEV)

- Botões ORBITAR 60×60px no rodapé junto ao polegar direito, acima das ações em portrait e adjacentes em landscape.
- Radar do chefe compacto e separado da vida/vulnerabilidades no canto superior direito; HUD textual fica fora do gameplay.
- Modo canhoto espelhado, SCAN desbloqueado no RPG aberto, regressões mobile e toque real.
- Integração experimental em PR isolada, requer CI completo e aceite físico antes de HML/PROD.

## 1.24.11 — Retirada do subchefe urbano e HUD periférico (DEV)

- Integra a correção P0 da PR #76 com o HUD v1.24.10: subchefe urbano recua após 22 segundos, foge em 4 segundos e não concede prêmio indevido.
- Retirada libera o chefe orbital e elimina o bloqueio de gameplay, sem ignorar ascensão por BOOST.
- Nove subchefes restantes preservados; alertas, barra de vida e impacto continuam nas bordas.
- CI, revisão visual e FPS mobile em hardware real são requisitos antes de HML/PROD.

## 1.24.10 — HUD periférico de impactos e subchefe (DEV)

- Confirmações textuais de colisão passam para o rail superior; centelha de contato permanece na cena.
- HP do subchefe reposicionado em cartão lateral superior no celular, sem atravessar a mira ou controles RPG.
- Testes Playwright com colisões reais e capturas de 320×568, 390×844 e 844×390.
- CI, revisão visual e aceite em hardware são gates obrigatórios antes de homologação.

## 1.24.9 — HUD superior e manual de controles na pausa (DEV)

- Mensagens de missão e avisos migram para uma faixa superior, preservando a mira e o centro do gameplay.
- Escudo baixo e aproximação de chefe piscam em amarelo; vida crítica e ataques iminentes piscam em vermelho; redução de movimento desliga as piscadas.
- Pausa passa a ensinar atalhos reais do PC e ações mobile, em português, inglês e espanhol.
- Corrigido conflito de toque das setas orbitais com o scanner no painel RPG expandido.
- CI, capturas e homologação em aparelhos reais continuam obrigatórios; sem publicação em HML ou produção.

## 1.24.8 — Candidata: controles mobile e naves espaciais detalhadas (DEV)

- Controle de órbita reposicionado para o canto inferior junto ao analógico, fora da nave e do retículo.
- Grade de combate à direita reorganizada para o polegar, com TIRO e BOOST destacados; inclui telas pequenas, landscape e canhotos.
- Cargueiras, capitânia, satélites e destroços com estruturas mais detalhadas e volumes de colisão preservados.
- CI, screenshots e homologação visual pendentes; preview isolado, sem promoção.

## 1.24.7 — Obstáculos espaciais somente após a subida orbital (DEV)

- O percurso por BOOST e os 38 segundos de travessia atmosférica deixam de gerar obstáculos que cruzam a câmera.
- Novos satélites, cargueiras e destroços só aparecem quando a fase orbital está completa.
- Playwright verifica toda a travessia sem obstáculos e confirma o tráfego espacial apenas depois da órbita.
- Candidata ainda não homologada visualmente; sem promoção para HML ou produção.

## 1.23 — Candidata: ritmo, dificuldade e encontro inicial (DEV)

- Fases 10–17% mais longas e boost obrigatório para a subida orbital no primeiro setor, sem corte brusco entre cidade e Terra.
- Configurações de dificuldade Fácil, Normal e Difícil. Cada nova sessão inicia em Normal; escolha de dificuldade vale apenas na sessão.
- No primeiro subchefe, janelas sem novas ondas de caças/obstáculos e abertura com tiros menos densos.
- Revisar testes, WebGL, controles desktop/mobile e ritmo de combate. **Sem homologação visual ou promoção.**

## 1.24.5 — Candidata de voo por setor e lançamento orbital (DEV)

- Rotas determinísticas com curvas localizadas por fase; corredores retos para setores 3, 5, 8 e 10.
- Primeira fase ganha ascensão gradual da cidade ao espaço com horizonte terrestre, atmosfera e estrelas.
- Chefe mantém arena sem curva; regressão com testes por setor e screenshots browser.
- Sem aprovação visual nem promoção para HML/PROD.

## 1.24.3 — Candidata em preparação

- Firebase Authentication: transição para modo visitante aguarda signOut e mantém status fiel; validação OAuth real pendente.

## 1.24.2 — Autenticação em DEV/HML

- Login Google com Firebase restrito aos ambientes fixos de desenvolvimento.
- Pré-visualizações de PR sem dependência de novos domínios OAuth.
- Candidata sujeita a CI e homologação.

## 1.24.1 — Protótipo de transformação robô para testes web

- Transformação entre nave e robô voador durante a partida, com controle por teclado e toque.
- Modo robô com tiros mais potentes e menor mobilidade, custo de energia e tempo de recarga.
- Correção de visibilidade da nave na transformação e reinício do setor.
- Versão candidata: publicação condicionada aos testes automatizados e homologação no navegador.

## 1.24.0 — GIRO mobile responsivo

- Toque rápido executa giro completo de 360°.
- Pressão sustentada inclina a nave suavemente e retorna ao soltar.
- Cancelamento de toque não dispara giro.

## 1.23.1 — Mira limpa e giro responsivo

- Indicador de blindagem menor e sem caixa sobre o alvo; confirmações ficam na borda do HUD.
- Botão de disparo maior no controle por toque.
- Giro defensivo completa 360 graus sem retorno visual inverso; segurar GIRO mantém a nave inclinada.
- Sem alterações intencionais nos atributos de combate ou progressão.

## 1.23.0 — Introdução cinematográfica 3D

- Sequência cinematográfica em tempo real com os cinco gatos e naves do esquadrão.
- Cena de perseguição de Marvin e apresentação da campanha antes da missão.
- Opção de pular a introdução, com legendas e retorno à navegação do menu.
- Reforço dos gates de qualidade, versionamento e validação no GitHub Actions.

## 1.22.0 — RPG acessível durante o voo

- Arma, especial e ativação saem da gaveta e ficam sempre acessíveis em uma barra compacta.
- Nível, XP, bônus efetivos de ataque, escudo, agilidade e arcana ganham leitura detalhada.
- Próximo desbloqueio e progresso até o nível seguinte ficam visíveis na gaveta RPG.
- HUD mobile ganha zonas seguras, botões maiores, carga/impulso circulares e contador de bombas.
- O aviso bloqueado deixa de cobrir o alvo e passa a usar um marcador compacto de impacto.
- Valores de combate, progressão, pilotos, naves, saves e canais nativos permanecem inalterados.

## 1.21.0 — Final exclusivo do Marvin

- HUD identifica a última resistência do Marvin sem alterar a cadência ou o orçamento de dano.
- Colapso final próprio com três anéis de energia representando os suprimentos recuperados.
- Mensagem de derrota exclusiva antes da tela de missão cumprida; recompensa continua única após oito segundos.
- Pausa, voo durante o colapso, reinício, controles e os nove chefes anteriores preservados.

## 1.20.0 — Subchefes táticos

- Dez perfis de movimento e aproximação ligados às silhuetas existentes dos subchefes.
- Cadência, mira e tipo de projétil variam por confronto e aumentam a pressão nas fases finais.
- Brilho de preparação e HUD identificam cada ataque antes da rajada, inclusive em celular.
- HP, fraquezas, bombas, recompensas, túnel, pausa, reinício e comportamento nativo preservados.

## 1.19.0 — Caças com papéis de combate

- Três papéis ligados aos modelos existentes: perseguição, interceptação lateral e leque de projéteis.
- Aproximação e janela de ataque antes da saída, com carga luminosa, pausa e reinício preservados.
- Testes do jogo real e capturas desktop/mobile; tempo de frames da fixture registrado como diagnóstico da CI.
- Subchefes e chefes mantêm os contratos anteriores; NW-06 segue parcial.

## 1.18.0 — Aviso antecipado de chefe

- Aviso discreto, localizado e sonoro antes da chegada de cada chefe, evitando surgimento inesperado.
- O aviso é limitado a uma ocorrência por fase, respeita as pausas e não altera o tempo do combate nem o HP dos chefes.
- Suporte a PT-BR, inglês e espanhol; verificação de estado, tempo e reset por harness determinístico.
- Continuidade do jogo, checkpoints, armas e personagens preservada.

## 1.17.0 — Impactos verificáveis e leitura de pontos fracos

- Efeitos de impacto no ponto projetado de colisão; feedback diferente para tiro bloqueado, acerto comum e ponto fraco.
- Sinais audiovisuais de escudo resistente, danos reais e vulnerabilidades confirmadas de chefes e subchefes, sem alterar HP, cadência ou multiplicadores.
- Traduções PT/EN/ES das mensagens de impacto, feedback compacto para dispositivos móveis, especificação e testes de regressão.
- Backlog vivo e prioridades de evolução registradas com status honesto de entrega web vs homologação física e nativos.

## 1.16.0 — Localização integral, mira e coleta assistida

- Catálogo PT-BR, inglês e espanhol para textos da campanha, hangar, HUD, menus, mensagens de combate e abertura; atualização de idioma sem recarregar o jogo.
- Retículo de mira projetado a partir do eixo real do disparo, acompanhando câmeras e movimento lateral.
- Anéis e suprimentos com magnetismo moderado e detecção varrida na passagem da nave, reduzindo falsos negativos.
- Confirmação imediata de coleta por mensagem dedicada, partículas e efeitos de áudio para anéis verdes e azuis.
- Contratos, testes de tradução, colisão e regressão no navegador preservando checkpoints e progressão.

## 1.15.0 — HUD, pausa e opções

- Logotipo sai do voo e título de fase desaparece após três segundos; radares de chefe mais compactos no celular.
- Menu de pausa permite continuar, reiniciar setor (com restauração do estado de entrada) e voltar ao menu, com confirmação para ações destrutivas.
- Tela de opções na abertura e na pausa: volume geral, música, efeitos, idioma da interface, sensibilidade de toque, opacidade, legendas, intro, vibração e modo canhoto.
- Preferências independentes do checkpoint e validadas antes do uso; redução de movimento preservada.
- Capa, Five Cats, Marvin, prólogo, recompensas, voo e conteúdo de combate da v1.14 permanecem intactos.

## 1.14.0 — Áudio, suprimentos e prólogo

- Música original na tela inicial sob gesto do usuário; efeitos de tiro e plasma mais suaves.
- Explosões de combate, alerta de integridade crítica e quatro itens para cuidar dos Five Cats.
- Abertura animada e pulável apresenta o roubo de suprimentos por Marvin.
- Correção da fuselagem e do nariz da NOVA-7 no hangar e no voo.
- Compatibilidade com checkpoints e os controles atuais.

## 1.13.0 — capa viva e hangar 360

- Capa animada com respeito a movimento reduzido.
- Retratos recortados da arte aprovada e esculturas 3D dos cinco gatos.
- Inspeção 360 das naves reais com cor, zoom, giro e controles por toque ou teclado.

## 1.12.0 — capa e voo de vitória

- Capa ilustrada e configuração de piloto/nave aberta sob comando.
- Elenco corrigido: Bia, Jenifer, Christopher, Bob e Calvinho.
- Christopher pesado e Jenifer ágil; checkpoints antigos preservados.
- Aproximação gradual dos chefes; movimento e tiros livres durante o colapso web.
- Marvin com rosto de pitbull no último setor.

## 1.11.0 — Esquadrão Five Cats

- Seleção visual dos cinco gatos com função, habilidade e seis atributos comparáveis.
- Três chassis de nave com silhuetas e compromissos próprios, além de cinco cores-base.
- Perfil escolhido altera dano, escudo, agilidade, arcana e potência de bomba.
- Galeria ilustrada de armas, blindagem, bomba e especiais antes da missão.
- Piloto, modelo e cor persistem no checkpoint; saves antigos usam Bia e NOVA-7.

## 1.10.0 — Combate orbital tático web

- Impactos visíveis na superfície, dano confirmado e bloqueio de blindagem distintos.
- Chefes móveis com dez perfis, zonas de risco, preparação de especiais e recuperação.
- Pontos fracos acompanham a orientação; scanner e radar lateral.
- Reservas para precisão, reparo e rajada guiada; recarga menor durante órbita.
- Proporções e apêndices distintos nos chefes web; resistência dos robôs preservada.

## 1.9.0 — Evolução contínua web

- RPG em gaveta lateral e especialidades Ataque, Defesa e Espiritual.
- Progressão após nível 10; carga acompanha armas, XP e pods.
- Subchefe inicial mais curto e impactos visíveis ao causar dano.
- Instrumentos iluminados no cockpit, ascensão orbital e detalhes nos inimigos.

## 1.8.0 — Combate estratégico web

- Dez evoluções por XP, módulos visuais, agilidade gradual e cinco famílias de armas.
- Barreira, nova e estase com energia arcana e recarga; fraquezas elementais.
- Pods acoplados amplificam dano; lançados perseguem inimigos com tiro guiado.
- Três variantes de tanques, robôs e caças com peças e silhuetas adicionais.
- Subchefes com chegada protegida, escudo cíclico e três fases de ataque.
- Arena relativa de 360°: J/L ou toque orbitam chefes e expõem geradores laterais.
- Checkpoints antigos aceitos; apps mantêm a versão anterior destas mecânicas.

## 1.7.0 — Câmeras e navegação ampla (web)

- Área de voo ampliada e perseguição com liberdade de enquadramento.
- Câmeras cockpit, perseguição e combate distante alternadas por C ou toque.
- Cockpit com painel e canhões, preservando projéteis e colisões da missão.
- Recursos disponíveis primeiro na web para validação; apps mantêm voo anterior.

## 1.6.0 — Validação web

- Trajetórias curvas, subida orbital e conduítes espaciais; voo guiado e controles preservados.
- Desafios laterais 2D nos setores 3 e 7, com pausa da campanha e prêmio único no retorno.
- Buraco negro estilizado com disco de acreção no setor final.
- Cinco pinturas no hangar, compradas com créditos e requisitos de acertos; propriedade e escolha persistem no checkpoint.
- Funcionalidades novas desativadas nos aplicativos até validação web. Release deste ciclo não distribui APK/AAB/IPA; metadados de versão permanecem sincronizados para os gates de compatibilidade.

## 1.5.0

- Projeto iOS com Swift Package Manager, pacote offline, versão sincronizada, ícone e manifesto de privacidade. CI compila e inicializa no simulador; assinatura e TestFlight ficam para a conta Apple do titular.

- Aplicativo Android Capacitor 8 com jogo e licenças incluídos, sem dependência de conexão durante a partida; compile/target API 36.
- Pausa idempotente e suspensão de áudio ao sair da atividade, inclusive durante respawn e colapso; retomada explícita preserva a sessão.
- Voltar pausa antes de minimizar. Tela imersiva, orientação de paisagem preferida e HUD/toque respeitando recortes e barras do sistema.
- Projeto Gradle, ícone Nova Wing, scripts de sincronização/APK/AAB e CI com APK debug e AAB release sem assinatura, sem chaves de publicação.

## 1.4.1

- Impulso esgotado encerra sem oscilar entre velocidades ou piscar os jatos; a energia recarrega continuamente enquanto o comando permanece pressionado.
- Comunicação explica como rearmar: soltar Shift/BOOST e pressionar novamente. Teclado, toque e cancelamento compartilham a regra, inclusive entre quadros.
- Regressões de esgotamento em três deltas e controles mistos; capturas WebGL desktop/mobile de impulso esgotado e reativado.

## 1.4.0

- Versionamento SemVer, número na capa, notas por release e GitHub Release após Pages.

- Capa simplificada, ajuda recolhida e painel de combate oculto no menu.
- Proteção de tiro no teclado e de seleção/callout no toque; foco no canvas.
- Extração de entrada para `src/input.js`, com cleanup e regressões.
- README consolidado, mapa de módulos e matriz de specs/testes; harness documentado por responsabilidade e gate.

## 1.3.0

- Boost com jato laranja alongado e rastros periféricos.
- Upgrades alcançáveis em telas estreitas, atração próxima e coleta varrida.
- Pods lançáveis com posição independente, retorno, leque e interceptação de projéteis.
- Dez anatomias de chefes e dez subchefes com identidade e ataques próprios.

## 1.2.0 — Chefes, evolução e trilha dinâmica

- Chefes com placas, canhões, cabos, reatores e dano visual; três etapas, resistência temporal e núcleo com janelas de ataque.
- Subchefe com modelo e barra próprios permanece na arena; encontros não se escondem dentro do túnel.
- Anéis verdes/cruz recuperam escudo e azuis/setas evoluem arma, alternadamente.
- Pods com núcleo, garras e carcaça em três evoluções e formação destacável.
- Colapso de oito segundos, explosões progressivas, destroços e onda de choque antes da recompensa.
- Arranjos musicais com bateria, harmonia e seis estados; proteção contra clipping e artefato WAV de validação.
- Removida imunidade permanente a projéteis na combinação máxima de arma/pods; giro defensivo preservado.

## 1.1.0 — Voo e instalação industrial

- Câmera com paralaxe lateral e inclinação suave; comunicações mais discretas.
- Controles móveis maiores, pressão prolongada protegida e liberação consistente.
- Tanques, robôs articulados, pórticos, reatores e trecho de batalha em túnel.
- Chefes biomecânicos preservando dez silhuetas e pontos fracos.
- Harness ampliado para câmera, colisões, combate terrestre, toque e capturas WebGL.

## 1.0.0 — Campanha Five Cats

- Dez setores, cenários próprios e chefes colossais com geradores destrutíveis.
- Subchefes, rivais, bases-servidor e obstáculos por ambiente.
- Loja, créditos, seis níveis de arma, plasma carregado, pods e três pilotos.
- Dez músicas e tema de chefe; controles independentes de áudio.
- Checkpoints locais e publicação Pages condicionada à CI.
- Testes da campanha completa e capturas de chefes desktop/mobile.

## 0.3.0 — Fundação para desenvolvimento com agentes

- Fontes modulares e HTML único gerado.
- Harness determinístico exercitando a lógica real.
- Documentação, skills de domínio, invariantes e CI.
- Caminho unificado de dano do chefe e proteção de ações fora da partida.

## 0.2.0 — Temática Nova Wing

- Piloto Bia, Marvin e identidade Five Cats.
- Cidade neon, água procedural, lua fragmentada e bloom.

## 0.1.0 — Protótipo de voo

- Missão 3D com inimigos, obstáculos, anéis e chefe.
- Teclado, controles de toque, escudo, bombas e aceleração.
