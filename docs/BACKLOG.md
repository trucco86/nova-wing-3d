# Backlog vivo — Nova Wing Five Cats

**Fonte atualizada em 22/10/2026.** Classificação por evidências do GitHub e pelas solicitações do mantenedor. O significado de **concluído** é _implementado e publicado no canal indicado_; homologação humana em dispositivos físicos é um item separado.

| ID    | Prioridade | Frente                                                     | Estado                                 | Critério de conclusão                                                                                                                       |
| ----- | ---------- | ---------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| NW-01 | P0         | Capa aprovada e hangar 360°                                | Publicado na web (v1.13+)              | Cinco gatos, seleção e modelos nave disponíveis                                                                                             |
| NW-02 | P0         | Abertura, música inicial, armas, alertas e suprimentos pet | Publicado na web (v1.14+)              | Intro narrativa, trilha e pickups presentes; áudio físico precisa validação                                                                 |
| NW-03 | P0         | HUD menos intrusiva, pausa, opções                         | Publicado na web (v1.15+)              | Menus e confirmações disponíveis; homologação iOS Safari pendente                                                                           |
| NW-04 | P0         | PT/EN/ES, mira e coleta de anéis                           | Publicado na web (v1.16)               | [CI v1.16](https://github.com/trucco86/nova-wing-3d/actions/runs/39751338828) verde; teste manual pendente                                  |
| NW-05 | P1         | Dano, feedback de acerto e pontos fracos                   | Em andamento (v1.17)                   | Sem dano ≠ dano; retículo e HUD; testes de regressão                                                                                        |
| NW-06 | P1         | Diferenciar IA e silhuetas de inimigos e subchefes         | Pendente                               | Variedade observável de telegraph, armas, esquiva e estágio; medir FPS                                                                      |
| NW-07 | P1         | Bosses: surgimento, ataques, vulnerabilidades e derrota    | Parcial                                | Entrada anunciada; dano e colisão claros; voo continua após boss; Marvin chefe final                                                        |
| NW-08 | P1         | RPG e upgrades rápidos durante gameplay                    | Parcial                                | Pilotos balanceados, nave/cor, atalhos mobile e clareza do benefício por upgrade                                                            |
| NW-09 | P1         | Cinemática 3D com personagens e universo reais             | Pendente                               | Render de nave + Bia/Jenifer/Christopher/Bob/Calvinho, Marvin vilão; história sem citar número de setores                                   |
| NW-10 | P1         | Som e acessibilidade                                       | Parcial                                | Revisão de timbre de tiros, plasma/colisão/explosão, mix, contraste, legendas, controles touch                                              |
| NW-11 | P1         | Harness e case profissional com demo end-to-end            | Parcial                                | [Case](case/README.md), [issue #21](https://github.com/trucco86/nova-wing-3d/issues/21); provar pedido→spec→PR→gates→release em clone limpo |
| NW-12 | P1         | Vídeo e portfolio com gameplay real                        | Parcial                                | Narração/storyboard existem; anexar vídeo de gameplay sem marca e evidência da versão                                                       |
| NW-13 | P2         | Paridade Android/iOS                                       | Pendente                               | Incluir versões web validadas, testes nativos em aparelhos reais, configurar distribuição                                                   |
| NW-14 | P2         | Agentes por etapa + handoffs reais                         | Projeto documentado, execução pendente | Executar com logs e limites concretos Product→Specs→Code→Quality→Review→Release                                                             |
| NW-15 | P2         | Métricas Agentic SDLC e observabilidade                    | Pendente                               | Tempo humano, retrabalho, custo, lead time, defeitos por SHA e baseline comparável                                                          |
| NW-16 | P2         | Campanha avançada e variedade RPG                          | Parcial                                | Tunel, subchefes, power-ups, espaço, buraco negro, minigames; revisão de qualidade e dificuldade                                            |
| NW-17 | P3         | Loja de skins e expansões de conteúdo                      | Parcial                                | Catálogo, progressão e experiência da loja testados e coerentes                                                                             |

## Regras de execução

- Web antes de apps; não confundir um teste Chromium com Safari/iPhone físico.
- Uma melhoria funcional = spec, diff limitado, teste, evidência CI por commit, changelog e release.
- Cada nova versão deve preservar saves, personagens e capa já aprovados.
- "Publicado" não significa necessariamente a melhor UX — feedback real pode reabrir itens.
- Não anunciar autonomia multiagente, produtividade ou métricas sem instrumentação.
- Para mudanças visuais, aceitar somente depois de uma captura de browser real; para áudio, testar com gesto de desbloqueio de áudio.

## Marcos técnicos

- [Histórico versionado](../CHANGELOG.md)
- [Gates e harness](HARNESS.md)
- [Arquitetura](ARQUITETURA.md)
- [Case público](case/README.md)
- [Backlog e case aberto](https://github.com/trucco86/nova-wing-3d/issues/21)
- [v1.16](https://github.com/trucco86/nova-wing-3d/releases/tag/v1.16.0)

Próximo foco após NW-05: **NW-06, NW-07, NW-08 e NW-09**. Cada um deve ser tratado com entrega separada para impedir regressões cruzadas.
