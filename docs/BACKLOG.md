# Backlog mestre — Nova Wing Five Cats

## P0 estratégico — Fidelidade gráfica premium (decisão do mantenedor em 30/10/2026)

**Ordem vigente para novos trabalhos:** elevar a qualidade gráfica até a direção artística da imagem-conceito, sem perder o suporte WebGL/navegador. Novas mecânicas, loja e expansões não críticas ficam **abaixo deste P0**. Correções impeditivas de jogabilidade, segurança e CI continuam P0 operacional.

| Prioridade | Vertical slice | Estado atual e evidência | Próximo gate |
| --- | --- | --- | --- |
| **P0-A** | Casco da nave principal e robô: nova silhueta, materiais PBR, eliminar geometria duplicada | [#177](https://github.com/trucco86/nova-wing-3d/pull/177) modelagem hero; [#178](https://github.com/trucco86/nova-wing-3d/pull/178) substituição real no Alto e normal/roughness maps (draft QA) | 4/4 Playwright, captura da nave em 3/4 no hangar, comparativo Alto/Médio em jogo e FPS 30s |
| **P0-B** | Pipeline de **GLB/glTF autoral** (caça, mecha, nave-mãe, chefes) e três LODs por asset | Não implementado | Definir pivôs/escala, limites de triângulos e texturas, materiais originais, loading/fallback progressivo |
| **P0-C** | Texturas físicas completas (base color, ORM, baked normal, emissive, decals, desgaste) | #178 implementa apenas detalhe PBR procedural inicial | Atlas UV e mapas autorais licenciados/gerados, comparar sob luz real em todos os ângulos |
| **P0-D** | Iluminação de estúdio/cinematográfica, composição por cena, contrastes, HDR/IBL e VFX | Graph 2–4 têm iluminação de base; passe cinematográfico ainda pendente | Testar legibilidade, performance e pós-processamento Alto/Médio |
| **P0-E** | Ambientes de campanha: biomas distintos, naves complexas, boss arenas e referências de escala | Cidade recebeu camadas High; demais cenários ainda repetitivos | Vertical slices por setor, revisão artística e eliminação de reutilização excessiva |
| **P0-F** | QA perceptivo e desempenho físico | [checklist Graphics 4](GRAPHICS-4-VALIDATION.md); não homologado fisicamente | Capturas 1366×768/844×390/390×844, 30 s FPS em Alto/Médio, aceite humano antes de merge |

A **produção permanece em v1.24.18**; as versões v1.27.x são candidatas encadeadas, não homologadas por mera conclusão de testes. Não mesclar #178 em DEV/HML/PROD sem validar base completa #167→#178 e receber aceite visual.


## Estado de integração — 30/10/2026 (referência mais recente)

**Ambientes não equivalentes:** produção está na linha `v1.24.18`; os incrementos `v1.27.x` estão em PRs draft/QA com bases encadeadas. Aprovação de testes em um branch não promove automaticamente DEV, HML ou produção. Validar SHA exato.

| Ordem | Frente                                                   | Candidata                                                 | Situação / próximo gate                                                                                                                       |
| ----- | -------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1  | Cinco Cats / menu com capa ampliada, medalhas e patentes | [#167](https://github.com/trucco86/nova-wing-3d/pull/167) | QA isolado, comparar layout e regressões; manter troféus e save                                                                               |
| P0.2  | Mecha Heavy Fire, braços, mira e áudio de canhão         | [#168](https://github.com/trucco86/nova-wing-3d/pull/168) | Baseado na #167; homologar nave ágil vs robô potente e desempenho mobile                                                                      |
| P0.3  | Marvin / Hidra: combate reativo e esquiva                | [#169](https://github.com/trucco86/nova-wing-3d/pull/169) | Baseado na #168; validar telegraph, golpes corpo a corpo, weak points, ritmo e dano                                                           |
| P0.4  | Capa original fullscreen, portraits e diálogos           | [#171](https://github.com/trucco86/nova-wing-3d/pull/171) | Baseado na #169; validar mobile retrato/paisagem e CTA sem cobrir a arte                                                                      |
| P0.5  | Abertura Five Cats em formação com Bia líder             | [#173](https://github.com/trucco86/nova-wing-3d/pull/173) | Baseado na #171; texto no topo, portraits 2D coerentes, naves/mecha 3D; validar abertura e pular                                              |
| P0.6  | Graphics 2.0: Automático / Médio / Alto                  | [#175](https://github.com/trucco86/nova-wing-3d/pull/175) | Baseado na #173; `v1.27.26` vertical slice cidade em QA; corrigido teste que abria Opções em tela oculta; repetir 4 shards e medir frame-time |
| P0.7  | Integração única DEV→HML→PROD                            | **Ainda não promovido**                                   | Fazer uma candidata composta dos commits **sem duplicar features**; quality, browser, preview, diff, testes físicos e autorização humana      |

### Próximas ondas, ainda não concluídas

1. **Qualidade gráfica:** após aprovar a cidade nos dois perfis, estender a outras fases, otimizar draw calls, luz e modelos, sem trocar WebGL por app.
2. **Gameplay:** variedade de objetivos e biomas; IA de chefes, minigames e transições de câmera contextuais; melhorar a legibilidade sem invadir o centro do gameplay.
3. **Progressão:** troféus, conquistas, patentes, medalhas, evolução RPG, loja, mapa, ranking e login Google exigem testes de persistência e UX integrados. Banco do ranking HML e configuração Firebase/Cloudflare dependem de credenciais e infraestrutura do mantenedor.
4. **Áudio e narrativa:** mix de menu, turbina do robô, boost, transformação, ataque especial dos cinco gatos, diálogos e final de chefe; usar apenas áudio original/licenciado.
5. **Case profissional:** vídeo real de gameplay, arquitetura, harness, responsabilidades por etapa, evidências da entrega integrada.
6. **Mobile nativo:** validar Android/iOS após versão web estável; não declarar publicação nativa sem gates e distribuição reais.

### Checklist de aceite por ambiente

- [ ] **DEV isolado:** código e bundle sincronizados; quality e quatro shards Playwright verdes **no SHA final**.
- [ ] **Graphics 2.0:** comparar `Automático`, `Médio` e `Alto` em 1366×768, 844×390, 390×844; medir 30 segundos de FPS/frame-time e documentar GPU.
- [ ] **UX:** capa fullscreen, texto de abertura no topo sem bloquear 5 naves, Bia liderando, pilotos/portrait/radio funcionando.
- [ ] **Gameplay:** chefes reagem e telegrafam golpes; mecha forte, nave ágil; mira, controles, anéis e HUD preservados.
- [ ] **Persistência:** saves, troféus, patentes, idioma/qualidade gráfica sem reset acidental.
- [ ] **HML:** revisão visual e aprovação humana em dispositivos reais; sem promover apenas com testes sintéticos.
- [ ] **Produção:** publicar um único commit validado, verificar Pages e manter plano de rollback.

As seções seguintes documentam snapshots anteriores e **não substituem esta ordem atualizada**. A preview da [PR #175](https://pr-175.nova-wing-preview.pages.dev/) é laboratório, não HML/PROD.

## Estado vigente — 27/10/2026 (substitui prioridades desatualizadas abaixo)

- **Áudio — nova prioridade do mantenedor:** candidata v1.26.0 sobre o Mecha integrado ao DEV: trilha mais grave/imersiva, servo e travas da transformação, turbina contínua e impactos reais. Composição original inspirada no clima pedido; exige renderização sonora real e avaliação de mixagem, sem homologação auditiva presumida.
- **Atualização desta integração:** v1.24.18 publicada em produção (main `5345128`, CI `40491623959` verde); #80/#85 encerradas por substituição nas #98/#99. DEV já contém dispersão (#100) e paletas (#103), v1.24.20. Candidata Mecha #102 reconciliada com este DEV para CI e preview integrados; não equivale a novo aceite visual humano.
- **Mobile v1.24.17:** release nas PRs [#96](https://github.com/trucco86/nova-wing-3d/pull/96)/[#97](https://github.com/trucco86/nova-wing-3d/pull/97), com quality/4 shards/Pages aprovados; **homologação funcional em celular confirmada pelo mantenedor em 27/10**. Esta confirmação não é medição instrumentada de FPS/bateria/temperatura.
- **Arsenal e mapa v1.24.18:** escopo das antigas #80/#85 consolidado nas [#98](https://github.com/trucco86/nova-wing-3d/pull/98) (HML) e [#99](https://github.com/trucco86/nova-wing-3d/pull/99) (main), com merge confirmado e versões main/dev/hml em v1.24.18. Multitiro, cadência, bombas e mapa foram incluídos. **Aceite visual específico da v1.24.18 não inferido** da aprovação mobile anterior.
- **Arma diferenciada (#84):** [#100](https://github.com/trucco86/nova-wing-3d/pull/100) candidata draft v1.24.19: dispersão comprável/equipável, cone de cinco projéteis, dano por alcance, salva/recarrega progresso. CI e balanceamento específicos obrigatórios; mísseis, feixe e bombas especializadas seguem pendentes.
- **Mecha/Fighter (#66):** a [#91](https://github.com/trucco86/nova-wing-3d/pull/91), com CI verde, foi integrada **somente à branch candidata da #69**, incluindo correções de propulsão e boost touch. Reconciliar #69 com a base atual antes de criar candidato DEV; validação estética/animada segue pendente.
- **Paletas/cidade-órbita:** [#90](https://github.com/trucco86/nova-wing-3d/pull/90) mantém CI verde no SHA original; requer rebase, revisão visual de todos os setores e aceitação antes de DEV/HML.
- **Identidade/ranking/áudio:** [issue #63](https://github.com/trucco86/nova-wing-3d/issues/63) (logout de convidado), Workers/D1 e efeitos/trilha cinematográfica seguem frentes P1 sem homologação de infraestrutura/áudio nesta onda.

**Sequência para novas funcionalidades:** branch isolada → CI completo no SHA final → DEV → preview e QA visual → HML → aceite humano da nova release → produção. Os snapshots anteriores abaixo são históricos.

---

## Integração Arsenal / mapa — v1.24.18

- Escopo de Arsenal/Mapa das PRs #80/#85 portado sobre produção v1.24.17, preservando órbita à esquerda acima do direcional.
- Multitiro, núcleo rápido, pacote de bombas e mapa da campanha em validação; publicação depende dos gates no SHA final.
- Próxima frente: Mecha/Fighter (#69/#91) e iluminação/paletas (#90), após esta entrega.

## Continuação P0 — v1.24.17

- v1.24.16 consolidada e publicada pelas PRs #93/#94.
- v1.24.17 publicada pelas PRs #96/#97: briefing e rádio alternados, duração real preservada e ORBITAR à esquerda imediatamente acima do direcional. Posicionamento aprovado pelo mantenedor.
- Depois: Arsenal/Hangar/Mapa (#80/#85), então Mecha/Fighter e paletas dos setores.
- Liberações do mantenedor recebidas; CI, revisão e deploy continuam verificáveis
  por commit. Não confundir a autorização com medições físicas não fornecidas.

## Prioridade vigente — candidata P0 v1.24.16

1. Consolidar e promover HUD/controles mobile e gameplay P0: analógico até 128 px,
   RPG no topo, órbita/radar periféricos, pausa, dificuldade, ascensão e retirada
   do subchefe. Base #89 + #92, preservando DEV/HML. Aceite do mantenedor recebido:
   "Todas liberações que eu precisava fazer estão ok. Aprovado". Revisão, CI e
   confirmação de deploy continuam gates técnicos; não há medição física fornecida.
2. Arsenal/hangar/mapa: integrar #80/#85 após o P0, testar economia, equipamentos
   e persistência.
3. Mecha/Fighter e arte: reconciliar #69/#87/#91 e #90, respeitando os critérios
   próprios de design, contraste e desempenho.
4. Chefes, áudio, narrativa, identidade/ranking e case/harness seguem o backlog
   detalhado, sem declarar funcionalidades futuras como entregues.

As seções abaixo preservam snapshots históricos e devem ser lidas com esta
prioridade vigente. Aprovação do pacote atual não valida automaticamente alterações
futuras ou serviços ainda não provisionados.

## Situação rastreada — 26/10/2026 (nova referência de acompanhamento)

Este quadro atualiza as referências históricas abaixo sem apagá-las. **Commit em branch, aprovação de CI, deploy de preview e homologação de gameplay são estados diferentes.** Acompanhar cada entrega com PR/SHA, gate e aceite de responsável.

- **NW-24 — Transformação:** [PR #52](https://github.com/trucco86/nova-wing-3d/pull/52) com merge em `main` confirmado; evolução visual não homologada.
- **NW-24 / #66 — Mecha e Fighter 2.0:** [PR #69](https://github.com/trucco86/nova-wing-3d/pull/69) e [PR #87](https://github.com/trucco86/nova-wing-3d/pull/87) são drafts encadeados. Próximo gate: CI do SHA final, capturas e aceite visual.
- **NW-24 — Implementações concorrentes:** [PR #54](https://github.com/trucco86/nova-wing-3d/pull/54), [PR #67](https://github.com/trucco86/nova-wing-3d/pull/67), [PR #68](https://github.com/trucco86/nova-wing-3d/pull/68) exigem comparação de diffs e conciliação; não mesclar cegamente.
- **NW-03 — Mobile e HUD:** [PR #78](https://github.com/trucco86/nova-wing-3d/pull/78), [PR #81](https://github.com/trucco86/nova-wing-3d/pull/81), [PR #82](https://github.com/trucco86/nova-wing-3d/pull/82), [PR #83](https://github.com/trucco86/nova-wing-3d/pull/83), [PR #85](https://github.com/trucco86/nova-wing-3d/pull/85) e [PR #86](https://github.com/trucco86/nova-wing-3d/pull/86) são drafts com bases diferentes e encadeadas; testes no SHA integrado e inspeção mobile são pendentes.
- **NW-03 — Analógico:** [PR #46](https://github.com/trucco86/nova-wing-3d/pull/46) permanece aberta com gates anteriores falhando. A dimensão de 128 px da PR ainda não consta no CSS atual de DEV/MAIN. Revalidar layout antes de integrar a mudança e não reutilizar workflows antigos sem revisão.
- **NW-29 — Paletas por setor:** [PR #51](https://github.com/trucco86/nova-wing-3d/pull/51) ainda aberta, formatação anterior falhou; contraste e FPS pendentes.
- **NW-22 — Login Google:** [PR #59](https://github.com/trucco86/nova-wing-3d/pull/59) mesclada em DEV; [issue #63](https://github.com/trucco86/nova-wing-3d/issues/63) rastreia risco do modo visitante. OAuth real e logout não homologados.
- **NW-21/NW-23 — Ranking/D1:** [PR #65](https://github.com/trucco86/nova-wing-3d/pull/65) mesclada em DEV; Worker e D1 provisionados/operacionais não comprovados.
- **NW-16 — Arsenal/mapa:** [PR #80](https://github.com/trucco86/nova-wing-3d/pull/80) é draft; [issue #84](https://github.com/trucco86/nova-wing-3d/issues/84) inclui armamento especializado. Economia e controles ainda não homologados.
- **NW-10/NW-11 — Áudio/harness:** nenhuma nova execução/homologação comprovada neste snapshot; preservar backlog histórico.

### Critérios de promoção

1. **DEV:** integrar somente depois de reconciliar variantes e obter qualidade, build e testes unitários no SHA integrado.
2. **HML:** CI completo, quatro shards de navegador, preview reproduzível e registro dos critérios de experiência; sem promoção automática a PROD.
3. **PROD (GitHub Pages):** homologação explícita do mantenedor, rollback verificado e ambiente/release identificados.
4. **Status:** manter como **pendente/não validado** qualquer comportamento sem teste funcional ou visual; não confundir workflow verde com aprovação do usuário.
5. **Consolidação de branches:** observar que as PRs #78–#86 têm bases encadeadas, e não compartilham necessariamente a mesma base da #69; usar integração de commits controlada.

---

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
