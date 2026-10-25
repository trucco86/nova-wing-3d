# Backlog mestre — Nova Wing Five Cats

## Atualização de plataforma — 25/10/2026 (UTC)

- Firebase Authentication (PR #59): integrado em DEV, sem homologação OAuth real.
- Cloudflare Pages: DEV/HML e previews publicados; Cloudflare Workers e D1 para ranking ainda não criados.
- PR #57 Firestore/Cloud Functions: proposta alternativa não integrada.
- Robô da PR #54: protótipo visual não aprovado; direção atual em [DESIGN-MECHA-STARFIGHTER](DESIGN-MECHA-STARFIGHTER.md).
- Referências: [arquitetura de plataforma](ARCHITECTURE-PLATFORM.md), [Firebase Auth](AUTH-FIREBASE.md) e [ranking proposto](RANKING-CLOUDFLARE.md).


**Consolidação: 24/10/2026.** Fonte: backlog anterior NW-01–NW-17, issues abertas #21, #34, #39–#42, PRs abertas #6, #7, #22, #38 e #43 e solicitações recentes. **Inventário de trabalho, não promessa de funcionalidades entregues.**

## Resumo executivo

- **28 épicos NW-01–NW-29**: 17 anteriores + 11 frentes complementares. Os épicos são agrupamentos de escopo, não tickets independentes de implementação.
- **6 issues abertas no GitHub**: #21, #34, #39, #40, #41 e #42. Outras frentes estão documentadas aqui e ainda não possuem issue própria.
- **PRs acompanhadas**: #6, #7, #22, #43, #44, #45 e #46; #38 integrada. PR aberta não significa funcionalidade concluída.
- **Prioridade por risco:** P0 (experiência quebrada/bloqueio), P1 (qualidade principal e combate), P2 (expansão e distribuição), P3 (experimentos futuros).
- **Responsável padrão:** mantenedor do projeto; agentes/skills podem implementar e revisar, mas não substituem a homologação do mantenedor.

## Backlog consolidado

- **NW-01 (P3) — Capa Five Cats e hangar 360°**. Estado: Publicado em versões anteriores; preservar. Referências: —. Dependência: —. Aceite: Capa aprovada e seleção preservadas.
- **NW-02 (P2) — Intro, música, plasma, alertas e itens pet**. Estado: Publicado em versão anterior; qualidade de áudio em revisão. Referências: —. Dependência: NW-10. Aceite: Ouvir em aparelho, capturas e ausência de regressões.
- **NW-03 (P0) — HUD mobile e controles sem colisão visual**. Estado: **Reaberto** por feedback real. Referências: [#40](https://github.com/trucco86/nova-wing-3d/issues/40). Dependência: —. Aceite: Capturas e teste de bounding boxes portrait/landscape, boss e safe-area.
- **NW-04 (P2) — Tradução PT/EN/ES, mira e anéis**. Estado: Publicado anteriormente; homologação pendente. Referências: —. Dependência: NW-03. Aceite: Todos os textos na língua escolhida e coleta confirmada.
- **NW-05 (P2) — Feedback de dano, blindagem e weak spots**. Estado: Publicado anteriormente; homologação pendente. Referências: —. Dependência: NW-07. Aceite: Distinção inequívoca entre acerto, bloqueio e vulnerabilidade.
- **NW-06 (P1) — IA, silhuetas e ritmo de inimigos/subchefes**. Estado: Parcial, em validação. Referências: —. Dependência: NW-07. Aceite: Padrões distinguíveis, telegraph e FPS observado.
- **NW-07 (P1) — Bosses com ataques específicos, arena e pontos fracos**. Estado: **Reaberto** por repetição de tiros. Referências: [#42](https://github.com/trucco86/nova-wing-3d/issues/42). Dependência: NW-05. Aceite: Choque, investida, tentáculos ou objetos conforme chefe; orbes do setor 3 destrutíveis.
- **NW-08 (P1) — RPG e upgrades acessíveis durante gameplay**. Estado: Em validação web. Referências: —. Dependência: NW-03. Aceite: Ações rápidas sem cobrir mira nem comandos.
- **NW-09 (P1) — Cinemática 3D narrativa Five Cats**. Estado: Pendente. Referências: [#34](https://github.com/trucco86/nova-wing-3d/issues/34). Dependência: NW-02. Aceite: História coerente, cinco gatos e Marvin; sem citar número de fases.
- **NW-10 (P1) — Som, mixagem e acessibilidade**. Estado: Parcial. Referências: —. Dependência: NW-03. Aceite: Plasma, explosões e alertas distintos, áudio desbloqueado, contraste e legendas.
- **NW-11 (P1) — Case profissional e harness end-to-end**. Estado: Parcial; PR de documentação anterior aberta. Referências: [#21](https://github.com/trucco86/nova-wing-3d/issues/21), [PR #22](https://github.com/trucco86/nova-wing-3d/pull/22). Dependência: NW-18. Aceite: Clone limpo → spec → PR → CI → release com evidências.
- **NW-12 (P2) — Vídeo de portfólio com gameplay real**. Estado: Parcial (roteiro/documentação). Referências: —. Dependência: NW-11. Aceite: Vídeo capturado e versão identificável.
- **NW-13 (P2) — Paridade Android/iOS**. Estado: Pendente. Referências: —. Dependência: NW-03, NW-07. Aceite: Testes físicos e distribuição nativa sem regressão.
- **NW-14 (P1) — Agentes/skills especializados com handoffs**. Estado: Parcial; experimentos antigos abertos. Referências: [PR #7](https://github.com/trucco86/nova-wing-3d/pull/7), [PR #6](https://github.com/trucco86/nova-wing-3d/pull/6). Dependência: NW-11. Aceite: Revisão UX, arquitetura, QA e CI rastreável, sem alegar autonomia inexistente.
- **NW-15 (P2) — Métricas de Agentic SDLC e observabilidade**. Estado: Pendente. Referências: —. Dependência: NW-11. Aceite: Baseline, lead time, defeitos e custo por SHA.
- **NW-16 (P2) — Campanha, minigames, túneis, RPG e dificuldade**. Estado: Parcial. Referências: —. Dependência: NW-07, NW-19. Aceite: Fases diferenciadas e progressão equilibrada.
- **NW-17 (P3) — Loja de skins e expansão de conteúdo**. Estado: Parcial. Referências: —. Dependência: NW-16. Aceite: Compras e save consistentes.
- **NW-18 (P1) — Badges CI, arquitetura, SonarQube e documentação técnica**. Estado: PR aberta; **SonarQube não configurado**. Referências: [PR #38](https://github.com/trucco86/nova-wing-3d/pull/38). Dependência: Identificadores SonarQube + secret. Aceite: Diagramas renderizam; badges reais; Quality Gate só após scanner real.
- **NW-19 (P0) — Curvas por setor e ascensão da primeira fase**. Estado: Correção inicial em PR draft; **não homologada**. Referências: [#39](https://github.com/trucco86/nova-wing-3d/issues/39), [PR #43](https://github.com/trucco86/nova-wing-3d/pull/43). Dependência: Build HTML e testes visuais. Aceite: Fase 1 transmite decolagem; outras curvas só quando justificadas; CI verde.
- **NW-20 (P1) — Dupla de naves e super especial Five Cats**. Estado: Pendente. Referências: [#41](https://github.com/trucco86/nova-wing-3d/issues/41). Dependência: NW-07, NW-03. Aceite: Recurso e cooldown, especial de 5 naves após setor 3, dano balanceado.
- **NW-21 (P2) — Ranking competitivo e leaderboard**. Estado: Ideia aprovada; sem implementação confirmada. Referências: —. Dependência: NW-23. Aceite: Antifraude básico, ranking por pontuação verificável e privacidade.
- **NW-22 (P3) — Login social Google na web**. Estado: Futuro; não iniciado. Referências: —. Dependência: NW-21. Aceite: Consentimento, autenticação segura e dados mínimos.
- **NW-23 (P2) — Identidade de sessão, score e integridade de resultados**. Estado: Planejamento necessário. Referências: —. Dependência: NW-21. Aceite: Modelo de score, validação server-side antes de ranking público.
- **NW-24 (P0) — Transformação nave → robô voador**. Estado: Ideia aprovada; não iniciada. Referências: —. Dependência: NW-07, NW-08. Aceite: Transformação durante o voo, modelo 3D completo com propulsores nas costas, tiros mais potentes e menor agilidade, transição reversível, cooldown e energia balanceados, HUD e comandos mobile, hitboxes e regressão dos chefes.

- **NW-25 (P1) — Pontos fracos distribuídos pelo corpo inteiro dos chefes, incluindo costas**. Estado: Planejado. Referências: [#47](https://github.com/trucco86/nova-wing-3d/issues/47), #42, NW-07. Dependência: câmera livre contextual e telegraph de ataques. Aceite: pontos vulneráveis distintos na frente, laterais e costas; rotação/manobra para acessar, feedback de dano, fases do chefe e teste de colisão por região.
- **NW-26 (P1) — Variedade de câmera: visão superior 3D e bônus lateral 3D**. Estado: Planejado. Referências: [#48](https://github.com/trucco86/nova-wing-3d/issues/48), NW-16. Dependência: câmera, input e HUD adaptativos. Aceite: fase em perspectiva superior mostrando o mesmo modelo 3D da nave; fase bônus lateral com a mesma nave em perfil, mantendo geometria, skins, tiro e hitboxes coerentes; transições claras, suporte touch e desempenho.
- **NW-27 (P1) — Arenas de chefes com ambientação própria**. Estado: Planejado. Referências: [#47](https://github.com/trucco86/nova-wing-3d/issues/47), #42, NW-07. Dependência: NW-26. Aceite: pelo menos um confronto dentro de cometa/cavidade espacial e outro dentro de nave/estrutura, com geometria, obstáculos, iluminação e limites próprios; rotas de saída e desempenho validados.
- **NW-28 (P1) — Estratégias e mecânicas exclusivas para cada chefe**. Estado: Planejado. Referências: [#47](https://github.com/trucco86/nova-wing-3d/issues/47), #42, NW-07. Dependência: NW-25, NW-27. Aceite: matriz de chefes com objetivo, padrão de ataque, telegraph, contramedida, condição de vulnerabilidade e fase de combate exclusivos; nenhum chefe vencido apenas pelo mesmo padrão de tiro frontal.

## Direção de arte — variedade visual das fases (NW-29, P1)

**Objetivo:** eliminar a sensação de fases repetitivas e excessivamente escuras, preservando contraste, legibilidade dos projéteis e desempenho mobile. Executar após a transformação NW-24 e em paralelo ao planejamento dos chefes, sem adiar correções críticas.

- **NW-29 (P1) — Identidade visual por setor.** Estado: Planejado. Aceite: cada setor recebe paleta própria de fundo, iluminação, neblina, materiais, silhuetas, arquitetura e elementos de primeiro/segundo plano; não depender apenas de trocar a cor do céu.
- **Paleta base:** nave e robô mantêm leitura consistente com ciano elétrico, branco e acentos coral; aliados, inimigos, projéteis, coleta e vulnerabilidades usam códigos visuais estáveis. Fundo não pode competir com mira, HUD e indicadores de dano.
- **Cidade e subida:** coral, dourado e ciano; prédios, tráfego e nuvens volumétricas, transição gradual para atmosfera.
- **Asteroides:** turquesa, violeta e âmbar; rochas em múltiplas profundidades, detritos e iluminação lateral.
- **Estruturas espaciais:** azul elétrico, vermelho e amarelo; corredores, hangares, comportas e silhuetas industriais.
- **Gelo e cristais:** azul-gelo, rosa e verde-água; reflexos, cavernas e formações cristalinas.
- **Nebulosa e regiões finais:** magenta, índigo, esmeralda e laranja; volumetria e contrastes controlados, sem tela inteira preta.
- **Ritmo e cenários:** variar formações de inimigos, obstáculos, altitude, velocidade percebida, aproximação do chefe, momentos de exploração e rotas; usar câmeras NW-26 quando a mecânica justificar.
- **Validação:** capturas comparativas por setor (desktop e mobile), checagem de acessibilidade/contraste, FPS e tempo de carregamento; assegurar que 3 setores consecutivos não compartilhem a mesma combinação de silhueta, iluminação e ritmo.

## Ordem de execução e ondas

- **S0 — estabilização:** concluir release mobile #46 e corrigir bloqueios críticos de HUD (#40); NW-19 (#39/PR #43) segue após transformação, salvo regressão bloqueante. Resultado: trajetória coerente e HUD mobile sem sobreposição.
- **S1 — transformação e chefes:** NW-24 (nave → robô voador) → NW-07 (#42) → NW-25/NW-28 → NW-27 → NW-29 → NW-20 (#41) → NW-06/NW-08. Resultado: ataques próprios e especiais de dupla/5 naves.
- **S2 — acabamento:** NW-26 → NW-10 → NW-09 (#34) → NW-04/NW-05. Resultado: áudio, narrativa e feedback homologáveis.
- **S3 — engenharia pública:** NW-18 (PR #38) → NW-11 (#21/PR #22) → NW-14 → NW-12. Resultado: harness, qualidade e case.
- **S4 — expansão:** NW-16 → NW-13 → NW-23 → NW-21 → NW-22 → NW-17 → NW-15. Resultado: conteúdo e plataformas com gates específicos.

**Decisão de priorização (24/10/2026):** após estabilizar a publicação em andamento, entregar primeiro a transformação nave → robô voador (NW-24), depois a diferenciação dos chefes (NW-07, NW-25, NW-28 e NW-27). Câmeras alternativas (NW-26) vêm depois. Não iniciar novas expansões antes desses marcos.

**Paralelismo seguro:** documentação NW-18 pode avançar junto de S0, sem alterar gameplay. PRs antigas #6, #7 e #22 devem ser revisadas quanto a conflitos/obsolescência antes de qualquer merge.

## Definição de pronto

1. Spec e critérios de aceite claros; testes de regressão e documentação atualizados.
2. Build gerado `index.html` sincronizado; `quality` e `browser` verdes no SHA final.
3. PR revisada e merge sem contornar proteção de branch; Pages e release verificados.
4. Capturas de navegador para mudanças visuais e homologação manual em aparelho para mobile.
5. Status separado: **planejado → em implementação → PR → CI verde → publicado → homologado**. Não equiparar CI verde à homologação humana.

## Fonte de verdade

GitHub Issues rastreia tickets executáveis; PRs registram diffs; este arquivo é o **índice consolidado de épicos**. Quando uma frente for dividida em tarefas, criar issue e vincular ao ID NW correspondente. Atualizar o índice ao fechar issues ou publicar releases.

## Histórico do backlog anterior

A versão anterior do backlog listava NW-01–NW-17 e foi preservada como referência na história do Git. As linhas acima incorporam esses itens e acrescentam NW-18–NW-29, sem assumir que melhorias discutidas foram homologadas.
