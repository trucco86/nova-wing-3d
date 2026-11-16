# Nova Wing — Backlog integrado e estratégia de ambientes (2026-10-24)

## Evidência e política de status
- Produção confirmada: tag v1.24.1.
- PR #54 v1.25.0: CI e Source repair check verdes no SHA b6265be5; draft, não mesclada, não publicada.
- 'Implementado' não significa homologado em dispositivos reais. Não marcar visual, áudio ou jogabilidade como aprovados sem avaliação.
- Prioridade P0: web; Android/iOS permanecem opt-in até homologação web.

## Trilha E — Ambientes, previews e governança
- E-01 P0: Preview efêmero e isolado por PR (primeiro caso PR #54), URL pública de teste, indicador visual de ambiente/commit.
- E-02 P0: DEV contínuo para integração antecipada; impedir que DEV publique em Pages de produção.
- E-03 P0: HML estável para release candidate e aceite funcional/visual.
- E-04 P0: gates separados: smoke/build para preview; quality/browser para HML; aceite explícito + quality/browser para PROD.
- E-05 P0: rollback por release/commit, proteção de main, não promover build diferente do homologado.
- E-06 P1: screenshots Playwright desktop/tablet/mobile, comparação visual, evidências por PR.
- E-07 P1: feature flags por ambiente para recursos experimentais, sem dependência de dados pessoais.
- E-08 P1: matriz de testes de nave/robô, pilotos, cores, pods, câmera, controles e performance.
- E-09 P1: retenção/limpeza automática de previews, limites de custos e permissões mínimas.
- E-10 P2: comparação lado a lado de versões e telemetria de testes.
- Critério de aceite da onda E-P0: PR #54 acessível em preview sem merge; DEV e HML isolados; PROD não altera; documentação de promoção/rollback.

## Trilha G — Gameplay e campanha
- G-01 P0: validar transformação nave/robô, energia, cooldown, dano/agilidade e reversão sem artefatos visuais (v1.25.0 candidata).
- G-02 P0: validar bosses/subbosses, pontos fracos, feedback de acerto e continuidade após derrota (implementações anteriores; aceite manual pendente).
- G-03 P1: expandir diversidade e IA de inimigos, dificuldade progressiva, chefes estratégicos.
- G-04 P1: liberdade de voo, curvas, órbita, túneis, portais, buraco negro, minigames 2D; regressões por setor.
- G-05 P1: pods R-Type acoplados/desacoplados, perseguição e upgrades; integração de lançadores do robô.
- G-06 P1: especial charge/plasma, bomba teleguiada, disparos variados, mira assistida.
- G-07 P1: transformação robô em encontros específicos e combate denso; balanceamento.

## Trilha V — Visual, HUD e experiência
- V-01 P0: homologação visual do robô angular, turbinas, cores e módulos por modelo.
- V-02 P0: layout responsivo mobile/tablet, tiro/boost prioritários, botão robô no topo com ícone correspondente.
- V-03 P0: resolver sobreposição de HUD, tags e alertas intrusivos; legibilidade de radar/barras.
- V-04 P1: câmera cockpit/perseguição/long shot, transições e feedback de transformação.
- V-05 P1: feedback de coleta de anéis, colisões, pickups e impactos.
- V-06 P1: aperfeiçoar naves, chefes, inimigos, efeitos de explosão e direção artística.
- V-07 P1: opções de idioma PT/EN/ES integral, controles, volume e acessibilidade.

## Trilha R — RPG, personagens e economia
- R-01 P0: regressão dos cinco gatos: Bia, Jenifer, Christopher, Bob e Calvinho, proporções e seleção.
- R-02 P1: chassis/modelos, cores/skins, atributos e progressão compartilhada nave/robô.
- R-03 P1: arquétipos ataque/defesa/espiritual, armas, armaduras, habilidades, upgrades e checkpoint.
- R-04 P1: itens temáticos de cuidado com pets (latinhas, petiscos, brinquedos, areia).
- R-05 P2: loja de cosméticos (roupas, uniformes, capacetes, óculos, relógios, acessórios), regras de monetização e equilíbrio.
- R-06 P2: ranking competitivo e antifraude; login social Google futuro, somente após decisões de privacidade e backend.

## Trilha A — Áudio e narrativa
- A-01 P1: música de menu/start e mixagem de efeitos.
- A-02 P1: áudio de tiros, carga plasma, explosões, alerta de vida crítica e chefes.
- A-03 P1: abertura cinematográfica, narrativa da perseguição de Marvin e encerramento.
- A-04 P1: trilhas por fase, volume independente e testes de autoplay mobile.

## Trilha S — Sound design cinematográfico (nova frente)
- S-01 P0: substituir timbres de minigame por direção musical original de ficção científica, inspirada no clima de mistério, tensão e percussão de Panzer Dragoon Saga, sem copiar melodias, gravações ou samples protegidos.
- S-02 P0: efeito original de transformação nave/robô em camadas (servos, metal, travas, turbinas e impacto final), sincronizado aos frames e reversão.
- S-03 P0: foguetes com ignição, lançamento, motor em voo e explosão, incluindo distância e prioridade de mixagem.
- S-04 P0: tiros das armas com assinatura por tipo (laser, plasma, projétil), impacto, cauda e variação para evitar repetição.
- S-05 P1: motores e propulsores com pitch/volume dinâmicos em aceleração, boost, frenagem e forma robô.
- S-06 P1: música adaptativa por estado (exploração, ameaça, subchefe, chefe, vitória, derrota) com transições suaves.
- S-07 P1: áudio espacial/posicional, ducking, limitador, controle separado de música/efeitos e testes com fones/celular.
- S-08 P1: alerta de vida crítica, colisões, coleta de itens e interfaces com hierarquia de prioridades.
- S-09 P1: testes automatizados de disparo de eventos de áudio, ausência de sobreposição excessiva, desbloqueio de áudio mobile e licenciamento dos assets.
- S-10 P2: temas musicais próprios para cada personagem/fase e trilha de boss final Marvin.
- Critério de aceite S-P0: demonstração em preview com nave e robô, comparativo antes/depois, avaliação subjetiva do impacto e verificação de performance. Áudio não deve ser aprovado só porque o evento foi disparado.

## Trilha Q — Engenharia, harness e publicação
- Q-01 P0: manter CI de quality/browser e source repair; evidência por commit.
- Q-02 P0: não publicar Android/iOS antes da validação web.
- Q-03 P1: agentes/skills para UX visual, arquitetura, código, testes, segurança, documentação e release; aprovação humana em alterações críticas.
- Q-04 P1: observabilidade de falhas WebGL, FPS, consumo de memória e performance mobile.
- Q-05 P1: SonarCloud ou equivalente, cobertura, duplicação e análise estática; confirmar plano/preço.
- Q-06 P1: documentação versionada (AGENTS.md, specs, ADR, testes, release notes), caso de Agentic SDLC.
- Q-07 P1: testes em Safari/iPhone físico, Android real, tablet e navegadores variados.
- Q-08 P2: vídeo de gameplay e apresentação do projeto como case público.
- Q-09 P2: evolução do pipeline nativo Android/iOS após aceite web.

## Ordem de execução
Onda 0: E-01..E-05, V-01/V-02 e G-01 usando PR #54 como piloto.
Onda 1: E-06..E-09, V-03..V-07, G-02, S-01..S-04 e Q-03/Q-04.
Onda 2: G-03..G-07, R-02..R-04, A-01..A-04, S-05..S-09 e Q-05..Q-07.
Onda 3: R-05/R-06, Q-08/Q-09, S-10 e E-10.

## Definição de pronto
- Implementação no código + evidência CI não bastam para aprovação visual.
- Preview: build navegável + smoke + URL/commit identificados; pode conter recursos experimentais.
- HML: qualidade/browser verdes, testes exploratórios, checklist visual e aceite.
- PROD: mesmo artefato homologado, aprovação explícita, rollback testado e Pages verificado.
