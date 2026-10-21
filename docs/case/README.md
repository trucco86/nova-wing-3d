# Nova Wing — um case de engenharia de software assistida por IA

> O produto é um jogo. O case é como uma ideia virou protótipo, ganhou feedback, evoluiu com controle de qualidade e tornou visível um processo de engenharia apoiado por IA.

**[Jogar](https://trucco86.github.io/nova-wing-3d/)** · **[Narrativa](CASE-STUDY.md)** · **[Modelo de agentes](PAPEIS-E-HANDOFFS.md)** · **[Evidências](EVIDENCIAS.md)** · **[Roteiro do vídeo](VIDEO.md)** · **[Métricas](METRICAS.md)**

![Gameplay real capturado em WebGL](../images/boost.png)

*Captura real do jogo; não é uma ilustração sintética de gameplay.*

## A ideia em 30 segundos

O Nova Wing 3D começou como uma hipótese: seria possível usar IA para encurtar o caminho entre uma ideia, um protótipo jogável e novas iterações? Conforme surgiram personagens, controles mobile, novas mecânicas, HUD, áudio e chefes, a pergunta mudou: **como evoluir mais rápido sem perder previsibilidade?**

A resposta investigada neste repositório é um fluxo com intenção clara, `specs/`, `AGENTS.md`, skills de domínio, testes determinísticos, navegador real, revisão de PR e CI/CD. O projeto é um **laboratório público, auditável e supervisionado por pessoas**, não um experimento controlado com prova de ROI nem uma fábrica de agentes totalmente autônoma.

## O que demonstramos

| Capacidade | Evidência no repositório |
| --- | --- |
| Ideia → protótipo → ciclos incrementais | [histórico](../../CHANGELOG.md), [releases](https://github.com/trucco86/nova-wing-3d/releases) |
| Contexto explícito para mudança | [instruções](../../AGENTS.md), [skills](../../skills/README.md), [specs](../../specs/README.md) |
| Testabilidade sem reimplementar o jogo | [harness determinístico](../../tests/harness.mjs), [testes](../TESTES.md) |
| Validação real de WebGL e mobile em browser | [suíte Playwright](../../tests/browser/) |
| Qualidade antes de publicar | [CI/CD](../../.github/workflows/ci.yml), [run da v1.15](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578) |
| Limites e aprendizado | [decisões](DECISOES.md), [evidências](EVIDENCIAS.md) |

## Navegação do case

1. [CASE-STUDY.md](CASE-STUDY.md): história, problema, decisões e mensagem executiva.
2. [PAPEIS-E-HANDOFFS.md](PAPEIS-E-HANDOFFS.md): desenho de responsabilidade por etapa e critérios de passagem.
3. [ARQUITETURA-DO-CASE.md](ARQUITETURA-DO-CASE.md): fluxo verificável, limites do harness e desenho técnico.
4. [EVIDENCIAS.md](EVIDENCIAS.md): alegações, URLs, SHA e ressalvas.
5. [DECISOES.md](DECISOES.md): escolhas técnicas, ganhos e trade-offs.
6. [METRICAS.md](METRICAS.md): como medir velocidade sem inventar percentuais.
7. [REPRODUZIR.md](REPRODUZIR.md): como executar e verificar.
8. [VIDEO.md](VIDEO.md): roteiro de narração e storyboard.
9. [CAPTURA.md](CAPTURA.md): plano para gravar gameplay autêntico e editar posteriormente.
10. [DECK.md](DECK.md): estrutura de apresentação de 8 telas.

## Transparência

As skills e instruções são reais; a **orquestração automática de vários agentes por etapa** é o modelo de evolução proposto. Ganhos de produtividade, DORA, qualidade absoluta, redução de custo ou múltiplos agentes executando autonomamente **não são resultados medidos** neste case.

[README principal](../../README.md) · [AGENTS.md](../../AGENTS.md) · [Código](../../src/)
