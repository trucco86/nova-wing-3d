# Backlog mestre — Nova Wing Five Cats

**Consolidação: 24/10/2026.** Fonte: backlog anterior NW-01–NW-17, issues abertas #21, #34, #39–#42, PRs abertas #6, #7, #22, #38 e #43 e solicitações recentes. **Inventário de trabalho, não promessa de funcionalidades entregues.**

## Resumo executivo

- **24 épicos NW-01–NW-24**: 17 anteriores + 7 frentes complementares. Os épicos são agrupamentos de escopo, não tickets independentes de implementação.
- **6 issues abertas no GitHub**: #21, #34, #39, #40, #41 e #42. Outras frentes estão documentadas aqui e ainda não possuem issue própria.
- **5 PRs abertas no momento da consolidação**: #6, #7, #22, #38 e #43. PR aberta não significa funcionalidade concluída.
- **Prioridade por risco:** P0 (experiência quebrada/bloqueio), P1 (qualidade principal e combate), P2 (expansão e distribuição), P3 (experimentos futuros).
- **Responsável padrão:** mantenedor do projeto; agentes/skills podem implementar e revisar, mas não substituem a homologação do mantenedor.

## Backlog consolidado

| ID    | Pri.   | Entrega / resultado esperado                             | Estado verificado ou declarado                              | Issue / PR                                                                                                            | Dependência                        | Aceite e evidência                                                                     |
| ----- | ------ | -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| NW-01 | P3     | Capa Five Cats e hangar 360°                             | Publicado em versões anteriores; preservar                  | —                                                                                                                     | —                                  | Capa aprovada e seleção preservadas                                                    |
| NW-02 | P2     | Intro, música, plasma, alertas e itens pet               | Publicado em versão anterior; qualidade de áudio em revisão | —                                                                                                                     | NW-10                              | Ouvir em aparelho, capturas e ausência de regressões                                   |
| NW-03 | **P0** | HUD mobile e controles sem colisão visual                | **Reaberto** por feedback real                              | [#40](https://github.com/trucco86/nova-wing-3d/issues/40)                                                             | —                                  | Capturas e teste de bounding boxes portrait/landscape, boss e safe-area                |
| NW-04 | P2     | Tradução PT/EN/ES, mira e anéis                          | Publicado anteriormente; homologação pendente               | —                                                                                                                     | NW-03                              | Todos os textos na língua escolhida e coleta confirmada                                |
| NW-05 | P2     | Feedback de dano, blindagem e weak spots                 | Publicado anteriormente; homologação pendente               | —                                                                                                                     | NW-07                              | Distinção inequívoca entre acerto, bloqueio e vulnerabilidade                          |
| NW-06 | P1     | IA, silhuetas e ritmo de inimigos/subchefes              | Parcial, em validação                                       | —                                                                                                                     | NW-07                              | Padrões distinguíveis, telegraph e FPS observado                                       |
| NW-07 | **P1** | Bosses com ataques específicos, arena e pontos fracos    | **Reaberto** por repetição de tiros                         | [#42](https://github.com/trucco86/nova-wing-3d/issues/42)                                                             | NW-05                              | Choque, investida, tentáculos ou objetos conforme chefe; orbes do setor 3 destrutíveis |
| NW-08 | P1     | RPG e upgrades acessíveis durante gameplay               | Em validação web                                            | —                                                                                                                     | NW-03                              | Ações rápidas sem cobrir mira nem comandos                                             |
| NW-09 | P1     | Cinemática 3D narrativa Five Cats                        | Pendente                                                    | [#34](https://github.com/trucco86/nova-wing-3d/issues/34)                                                             | NW-02                              | História coerente, cinco gatos e Marvin; sem citar número de fases                     |
| NW-10 | P1     | Som, mixagem e acessibilidade                            | Parcial                                                     | —                                                                                                                     | NW-03                              | Plasma, explosões e alertas distintos, áudio desbloqueado, contraste e legendas        |
| NW-11 | P1     | Case profissional e harness end-to-end                   | Parcial; PR de documentação anterior aberta                 | [#21](https://github.com/trucco86/nova-wing-3d/issues/21), [PR #22](https://github.com/trucco86/nova-wing-3d/pull/22) | NW-18                              | Clone limpo → spec → PR → CI → release com evidências                                  |
| NW-12 | P2     | Vídeo de portfólio com gameplay real                     | Parcial (roteiro/documentação)                              | —                                                                                                                     | NW-11                              | Vídeo capturado e versão identificável                                                 |
| NW-13 | P2     | Paridade Android/iOS                                     | Pendente                                                    | —                                                                                                                     | NW-03, NW-07                       | Testes físicos e distribuição nativa sem regressão                                     |
| NW-14 | P1     | Agentes/skills especializados com handoffs               | Parcial; experimentos antigos abertos                       | [PR #7](https://github.com/trucco86/nova-wing-3d/pull/7), [PR #6](https://github.com/trucco86/nova-wing-3d/pull/6)    | NW-11                              | Revisão UX, arquitetura, QA e CI rastreável, sem alegar autonomia inexistente          |
| NW-15 | P2     | Métricas de Agentic SDLC e observabilidade               | Pendente                                                    | —                                                                                                                     | NW-11                              | Baseline, lead time, defeitos e custo por SHA                                          |
| NW-16 | P2     | Campanha, minigames, túneis, RPG e dificuldade           | Parcial                                                     | —                                                                                                                     | NW-07, NW-19                       | Fases diferenciadas e progressão equilibrada                                           |
| NW-17 | P3     | Loja de skins e expansão de conteúdo                     | Parcial                                                     | —                                                                                                                     | NW-16                              | Compras e save consistentes                                                            |
| NW-18 | **P1** | Badges CI, arquitetura, SonarQube e documentação técnica | PR aberta; **SonarQube não configurado**                    | [PR #38](https://github.com/trucco86/nova-wing-3d/pull/38)                                                            | Identificadores SonarQube + secret | Diagramas renderizam; badges reais; Quality Gate só após scanner real                  |
| NW-19 | **P0** | Curvas por setor e ascensão da primeira fase             | Correção inicial em PR draft; **não homologada**            | [#39](https://github.com/trucco86/nova-wing-3d/issues/39), [PR #43](https://github.com/trucco86/nova-wing-3d/pull/43) | Build HTML e testes visuais        | Fase 1 transmite decolagem; outras curvas só quando justificadas; CI verde             |
| NW-20 | P1     | Dupla de naves e super especial Five Cats                | Pendente                                                    | [#41](https://github.com/trucco86/nova-wing-3d/issues/41)                                                             | NW-07, NW-03                       | Recurso e cooldown, especial de 5 naves após setor 3, dano balanceado                  |
| NW-21 | P2     | Ranking competitivo e leaderboard                        | Ideia aprovada; sem implementação confirmada                | —                                                                                                                     | NW-23                              | Antifraude básico, ranking por pontuação verificável e privacidade                     |
| NW-22 | P3     | Login social Google na web                               | Futuro; não iniciado                                        | —                                                                                                                     | NW-21                              | Consentimento, autenticação segura e dados mínimos                                     |
| NW-23 | P2     | Identidade de sessão, score e integridade de resultados  | Planejamento necessário                                     | —                                                                                                                     | NW-21                              | Modelo de score, validação server-side antes de ranking público                        |
| NW-24 | P2     | Transformação nave → robô voador                         | Ideia aprovada; não iniciada                                | —                                                                                                                     | NW-07, NW-08                       | Transformação com trade-off de mobilidade/dano e teste mobile                          |

## Ordem de execução e ondas

| Onda | Objetivo | Sequência recomendada | Saída |
| --- | --- | --- | --- |
| S0 — estabilização | Recuperar legibilidade e identidade de voo | NW-19 (#39/PR #43) → NW-03 (#40) | Trajetória coerente e HUD mobile sem sobreposição |
| S1 — chefes e coop | Melhorar variedade de combate | NW-07 (#42) → NW-20 (#41) → NW-06/NW-08 | Bosses com telegraph e especiais de dupla/5 naves |
| S2 — acabamento | Som, narrativa e qualidade | NW-10 → NW-09 (#34) → NW-04/NW-05 | Experiência audiovisual homologável |
| S3 — engenharia pública | Repositório de referência | NW-18 (PR #38) → NW-11 (#21/PR #22) → NW-14 → NW-12 | Diagramas, qualidade real, harness e case |
| S4 — expansão | Campanha, apps e competição | NW-16 → NW-24 → NW-13 → NW-23 → NW-21 → NW-22 → NW-17 → NW-15 | Conteúdo e plataformas com gates específicos |

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

A versão anterior do backlog listava NW-01–NW-17 e foi preservada como referência na história do Git. As linhas acima incorporam esses itens e acrescentam NW-18–NW-24, sem assumir que melhorias discutidas foram homologadas.

