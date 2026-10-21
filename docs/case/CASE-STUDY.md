# Nova Wing: o aprendizado é maior que o jogo

## Resumo executivo

**Nova Wing é um experimento de desenvolvimento de produto e engenharia de software assistida por IA.** Uma ideia inicial de um jogo de naves foi transformada em um protótipo jogável e, por ciclos sucessivos de feedback, em uma experiência 3D com campanha, naves, personagens, chefes, áudio, HUD e suporte a teclado e toque.

O ponto mais interessante não foi conseguir gerar mais código. Foi aprender a **transformar intenção em entregas verificáveis**, reduzindo a distância entre quem imagina um comportamento, quem o implementa e quem confirma que ele realmente funciona.

## 1. A pergunta inicial

Eu queria validar uma hipótese concreta: **até onde conseguiria levar uma ideia usando IA para apoiar a construção do software?**

Um jogo foi um bom ambiente para testar porque o feedback aparece na hora. A nave se move ou não se move. O som toca ou não. Um chefe trava a partida ou o jogador continua voando. Em poucos minutos é possível identificar o que precisa mudar.

Isso não torna o desenvolvimento trivial. Ao contrário: experiências interativas evidenciam como uma entrega aparentemente pequena pode afetar controles, FPS, interface, som, física, progressão e dispositivos diferentes.

## 2. O primeiro aprendizado: prototipar rápido não é entregar sem critério

O protótipo ajudou a materializar hipóteses. Mas cada nova funcionalidade aumentou o risco de regressão. O problema deixou de ser somente criar mecânicas e passou a ser **evoluir sem destruir decisões anteriores**.

O feedback do gameplay precisou se tornar:

- um problema observável;
- critérios de aceite;
- limites de mudança;
- casos de teste;
- evidências associadas à versão.

O repositório registra essa disciplina por meio de [specs](../../specs/README.md), [código editável](../../src/), [testes](../../tests/) e [histórico](../../CHANGELOG.md).

## 3. O segundo aprendizado: contexto virou um ativo de engenharia

Quando uma mudança depende de conversas antigas, a equipe — humana ou apoiada por agentes — precisa reconstruir a intenção a cada tarefa. Foi necessário dar estrutura ao conhecimento: o que é fonte de verdade, onde editar, o que não alterar, como testar e quando interromper a publicação.

`AGENTS.md` documenta regras transversais; `skills/` descreve procedimentos por domínio; `specs/` traz contratos de mudança; `docs/` explica arquitetura e operação. Essa base **não garante** que um modelo siga tudo perfeitamente, mas torna erros, omissões e decisões mais visíveis e revisáveis.

## 4. O terceiro aprendizado: agentes especializados precisam de fronteiras

Uma direção de evolução é decompor o fluxo em responsabilidades: descoberta/produto, arquitetura, implementação, testes, revisão e release. Cada papel recebe entradas claras e produz um artefato para a etapa seguinte, com critérios de passagem explícitos.

No repositório atual, existem **skills e ferramentas de suporte**, não evidência de uma orquestração autônoma e permanente desses papéis. O [modelo proposto](PAPEIS-E-HANDOFFS.md) foi escrito precisamente para tornar essa futura automação mensurável, auditável e limitada.

## 5. O quarto aprendizado: harness acelera feedback, não substitui engenharia

O harness injeta relógio, entradas, aleatoriedade, DOM e renderer controlados na **implementação real** do jogo. Isso viabiliza testar pausa, dano, movimento e progressão sem rodar WebGL para cada cenário. O navegador real complementa essa camada verificando renderização e interações que os mocks não conseguem provar.

CI/CD executa gates sobre o commit: formatação, lint, testes, invariantes, build reproduzível e navegação. A publicação depende dos jobs declarados no workflow; a aceitação humana segue indispensável para ergonomia, narrativa e qualidade de áudio em dispositivos reais.

## 6. Um exemplo: a evolução da interface mobile

O problema não foi "criar uma HUD melhor". Foi identificar que o logotipo e os textos fixos ocupavam espaço demais, o radar podia competir com outras informações e faltava reinício/sair com confirmação.

Na [v1.15](../../specs/web-v1-15-hud-settings.md), isso foi traduzido em título temporário, radar mais compacto, menu de pausa, preferências separadas do checkpoint e regressões específicas. O [PR #24](https://github.com/trucco86/nova-wing-3d/pull/24) e a [CI associada](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578) deixam o resultado rastreável.

A mudança também mostra uma limitação: green build não substitui jogar no dispositivo físico e avaliar o comportamento com os dedos na tela.

## 7. O resultado — e o que ainda não podemos afirmar

O que pode ser mostrado hoje: jogo público, evolução versionada, documentação de contexto, testes, gates, PRs, falhas e correções. O que **não** pode ser afirmado sem estudo adicional: “x% de produtividade”, “redução de custo”, “zero bugs”, “ciclo totalmente autônomo” ou “performance comprovada em todo dispositivo”.

Se quisermos demonstrar aceleração, precisaremos medir um baseline de entregas e compará-lo com tarefas equivalentes, rastreando esforço humano, chamadas de IA, retrabalho e custo. Veja [métricas](METRICAS.md).

## 8. Por que isso importa além de um jogo

A mesma pergunta aparece em software empresarial: **o que acontece quando gerar código deixa de ser a parte mais cara da mudança?**

O valor migra para qualidade do upstream — problema, regras e critérios — e para confiança do downstream — contexto, testes, políticas e observabilidade. Mais importante do que automatizar cada etapa é criar uma cadeia em que as decisões e evidências sobrevivem à próxima iteração.

> Minha maior conclusão foi que trabalhar com IA não elimina a necessidade de engenharia. Aumenta a importância de ter engenharia suficientemente clara para que pessoas e agentes consigam contribuir sem perder o controle.

**[Explorar o fluxo](ARQUITETURA-DO-CASE.md)** · **[Ver evidências](EVIDENCIAS.md)** · **[Assistir ao roteiro](VIDEO.md)**

### English executive abstract

Nova Wing began as a playable idea and became a transparent experiment in AI-assisted software delivery. The core lesson is not “AI writes games”; it is that faster iteration requires explicit context, verifiable specifications, a deterministic test harness, real-browser validation and accountable CI/CD. Specialized agent roles are a proposed operating model rather than a claim of an already autonomous multi-agent system. The repository provides inspectable artifacts and release evidence, while productivity gains remain to be measured.
