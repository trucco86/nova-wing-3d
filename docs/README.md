# Documentação · Nova Wing 3D

**Um ponto de entrada para diferentes públicos:** jogadores, engenheiros, líderes de tecnologia e pessoas estudando AI SDLC.

[![Voltar ao projeto](https://img.shields.io/badge/↖-README%20principal-1b4355)](../README.md) [![Jogar](https://img.shields.io/badge/▶-Jogar-167a6b)](https://trucco86.github.io/nova-wing-3d/) [![Case](https://img.shields.io/badge/AI%20SDLC-Case-506db8)](case/README.md)

![Gameplay do Nova Wing capturado em WebGL](images/boost.png)

## Comece pelo seu objetivo

| Quero entender... | Documento | Conteúdo |
| :--- | :--- | :--- |
| **O valor do case** | [Portfólio / visão executiva](PORTFOLIO-AI-SDLC.md) | Problema, abordagem, ganhos qualitativos e limites |
| **O ciclo completo** | [Case de AI SDLC](case/README.md) | História, princípios, agentes propostos e documentação |
| **Uma entrega concreta** | [Ciclo de outubro de 2026](case/CICLO-REAL-OUTUBRO-2026.md) | Feedback, correção, falhas, gates, PRs e deploy |
| **O produto** | [Guia do jogo](GAMEPLAY-GUIDE.md) | Mecânicas, campanha, controles e desafios |
| **A arquitetura** | [Plataforma](ARCHITECTURE-PLATFORM.md) | WebGL, fontes, identidade, ranking e ambientes |
| **Os ambientes** | [DEV / HML / PROD](DEPLOY-ENVIRONMENTS.md) | Preview, promoção, evidências e rollback |
| **O QA** | [Testes](TESTES.md) / [Harness](HARNESS.md) | Testes determinísticos e navegação real |
| **As regras dos agentes** | [AGENTS.md](../AGENTS.md) / [skills](../skills/README.md) | Contexto, responsabilidades, limites e procedimentos |
| **Métricas** | [Plano de mensuração](case/METRICAS.md) | Lead time, DORA, retrabalho, custo e validade metodológica |
| **O que é comprovado** | [Matriz de evidências](case/EVIDENCIAS.md) | Fonte, SHA, ambiente e limitação |
| **Como reproduzir** | [Guia de reprodução](case/REPRODUZIR.md) | Instalação, build, CI e Playwright |

## Três trilhas de leitura

### Para executivos · 5 minutos

[Visão executiva](PORTFOLIO-AI-SDLC.md) → [Ciclo real](case/CICLO-REAL-OUTUBRO-2026.md) → [Evidências](case/EVIDENCIAS.md).

O ponto central: IA reduz a fricção para prototipar; controles de contexto, qualidade e entrega tornam o ganho potencial sustentável.

### Para engenharia · 15 minutos

[Arquitetura do case](case/ARQUITETURA-DO-CASE.md) → [Harness](HARNESS.md) → [CI](../.github/workflows/ci.yml) → [Testes](TESTES.md) → [Reproduzir](case/REPRODUZIR.md).

O ponto central: observar os mesmos módulos que rodam no jogo, instrumentados por testes determinísticos e testes de navegador.

### Para quem quer jogar

[Jogo público](https://trucco86.github.io/nova-wing-3d/) → [Guia](GAMEPLAY-GUIDE.md) → [Backlog](BACKLOG.md).

## Critério de verdade

**Implementado** significa código versionado. **Testado** exige resultado em uma execução identificada. **Publicado** exige commit e deploy conferidos. **Homologado** exige aceite humano no cenário indicado. Esses estados não são intercambiáveis.

> O conteúdo mais antigo pode referir versões anteriores. Prefira sempre [o changelog](../CHANGELOG.md), [o commit](https://github.com/trucco86/nova-wing-3d/commits/dev) e [as execuções](https://github.com/trucco86/nova-wing-3d/actions) para consultar o estado presente.
