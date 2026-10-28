# Matriz de evidências — o que é observável

**Baseline auditado:** versão v1.15.0; commit de main `2ffcf1bf47b212c1480b582a0b2fe6fa1efd8da1`; consulta em 21/10/2026. Novas versões precisam de evidências por SHA próprio; não herdam automaticamente esta aprovação.

| Afirmação                    | Evidência auditável                                                                                  | Verificação                                 | Limitação                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Jogo acessível publicamente  | [Jogar](https://trucco86.github.io/nova-wing-3d/), [código](../../src/)                              | Abrir no navegador e comparar com versão    | Disponibilidade e recursos dependem de rede/browser |
| Evolução incremental         | [CHANGELOG](../../CHANGELOG.md), [PRs](https://github.com/trucco86/nova-wing-3d/pulls?q=is%3Apr)     | Seguir feature/spec/PR                      | Histórico não prova velocidade relativa             |
| Contexto para agentes        | [AGENTS.md](../../AGENTS.md), [skills](../../skills/README.md)                                       | Verificar instruções e módulos              | Instruções não são orquestração multiagente         |
| Specs e requisitos testáveis | [specs](../../specs/README.md), [v1.15](../../specs/web-v1-15-hud-settings.md)                       | Conferir critérios e casos                  | Uma spec pode ficar obsoleta sem revisão            |
| Testes do código real        | [harness](../../tests/harness.mjs), [testes Node](../../tests/)                                      | `npm test`                                  | Substitutos de DOM/GPU não provam experiência       |
| Navegador e WebGL            | [testes Playwright](../../tests/browser/)                                                            | `npm run validate -- --browser`             | Execução de CI não substitui hardware físico        |
| Qualidade da entrega         | [workflow CI](../../.github/workflows/ci.yml)                                                        | Examinar jobs, dependências e status        | YAML sozinho não configura proteção de branch       |
| Mudança mobile rastreável    | [PR #24](https://github.com/trucco86/nova-wing-3d/pull/24), [testes](../../tests/web-v1-15.test.mjs) | Inspecionar diffs, checks e resultado       | Aceite visual humano é independente                 |
| Commit com pipeline aprovado | [Run #39591873578](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578)                | Verificar SHA e conclusão `success`         | O status não se aplica a futuros commits            |
| Aprendizado após falha       | [Execução com falha](https://github.com/trucco86/nova-wing-3d/actions/runs/39590858098)              | Comparar SHA e logs com execuções seguintes | Não atribuir causa sem examinar logs                |
| Captura real de gameplay     | [Screenshot WebGL](../images/boost.png)                                                              | Abrir o arquivo de imagem                   | Screenshot não representa medição de FPS            |

## Atualização de evidências — 28/10/2026

O baseline histórico abaixo continua válido **somente para a versão e o SHA indicados**, não como estado da release atual.

| Afirmação recente                 | Referência                                                                                                                                                                                                                                 | O que foi verificado                                                             | Limite                                                                    |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **DEV v1.27.2** publicada         | [PR #132](https://github.com/trucco86/nova-wing-3d/pull/132), [deploy 40739691957](https://github.com/trucco86/nova-wing-3d/actions/runs/40739691957)                                                                                      | Integração da melhoria de menu e deploy Cloudflare reportado como concluído      | Publicação não equivale a aceite mobile                                   |
| **Bug mobile paisagem** corrigido | [PR #133](https://github.com/trucco86/nova-wing-3d/pull/133), [deploy 40743883711](https://github.com/trucco86/nova-wing-3d/actions/runs/40743883711)                                                                                      | Ajuste do acesso a controles em viewport compacto e entrega v1.27.3              | Emulação Chromium não substitui Safari físico                             |
| **Turbina do robô** ajustada      | [PR #134](https://github.com/trucco86/nova-wing-3d/pull/134), [CI 40744556964](https://github.com/trucco86/nova-wing-3d/actions/runs/40744556964), [deploy 40744797302](https://github.com/trucco86/nova-wing-3d/actions/runs/40744797302) | `quality`, quatro shards browser e gate agregado passaram; DEV v1.27.4 publicado | Conforto auditivo depende de teste humano                                 |
| **Developer/QA v1.27.5 aprovado pelo usuário** | [PR #135](https://github.com/trucco86/nova-wing-3d/pull/135), [CI 40760103314](https://github.com/trucco86/nova-wing-3d/actions/runs/40760103314), [deploy 40761706288](https://github.com/trucco86/nova-wing-3d/actions/runs/40761706288), [release](../../releases/v1.27.5.md) | QA automatizado aprovado, publicação em DEV confirmada e aceite funcional relatado pelo solicitante em 28/10/2026 no SHA `0c0e1e1890578f8afb44880bd1da6dd29451f173` | Dispositivo e navegador não informados; aceite não autoriza promoção a HML/PROD |

**Estado por branch em 28/10/2026:** [`main`](https://github.com/trucco86/nova-wing-3d/tree/main) v1.24.18; [`hml`](https://github.com/trucco86/nova-wing-3d/tree/hml) v1.24.24; [`dev`](https://github.com/trucco86/nova-wing-3d/tree/dev) v1.27.5 (aceite funcional do SHA `0c0e1e1` registrado). A atualização exclusivamente documental posterior não implica novo aceite de gameplay. Não confundir DEV com produção.

[Estudo do ciclo real](CICLO-REAL-OUTUBRO-2026.md) · [Visão executiva](../PORTFOLIO-AI-SDLC.md)

## O que **não** devemos afirmar sem novos dados

- “Produtividade aumentou 40%”, “reduzimos custo pela metade” ou “entregamos em X horas versus Y”.
- “Todo desenvolvimento foi realizado por agentes autônomos independentes”.
- “O jogo não tem bugs” ou “todos os dispositivos móveis foram testados”.
- “O CI/CD impõe aprovação humana para toda alteração”: isso depende de configurações administrativas e das permissões efetivas.
- “O jogo equivale a uma implantação corporativa de Agentic SDLC”.

## Como ampliar a prova

1. Vincular cada mudança ao ID da hipótese, spec, branch, PR e SHA.
2. Registrar execução, modelo, custos, tempo e reprocessamentos por agente **quando instrumentados**.
3. Coletar duração por etapa, incidentes, regressões e qualidade humana com baseline comparável.
4. Arquivar evidências de vídeo e dispositivo com data, ambiente e versão.
5. Citar a fonte da métrica e o método de amostragem; preservar resultados desfavoráveis.

_Os artefatos do GitHub Actions podem expirar. O commit, o PR, a spec e o changelog funcionam como índices duradouros de proveniência._
