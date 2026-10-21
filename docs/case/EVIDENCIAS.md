# Matriz de evidências — o que é observável

**Baseline auditado:** versão v1.15.0; commit de main `2ffcf1bf47b212c1480b582a0b2fe6fa1efd8da1`; consulta em 21/10/2026. Novas versões precisam de evidências por SHA próprio; não herdam automaticamente esta aprovação.

| Afirmação | Evidência auditável | Verificação | Limitação |
| --- | --- | --- | --- |
| Jogo acessível publicamente | [Jogar](https://trucco86.github.io/nova-wing-3d/), [código](../../src/) | Abrir no navegador e comparar com versão | Disponibilidade e recursos dependem de rede/browser |
| Evolução incremental | [CHANGELOG](../../CHANGELOG.md), [PRs](https://github.com/trucco86/nova-wing-3d/pulls?q=is%3Apr) | Seguir feature/spec/PR | Histórico não prova velocidade relativa |
| Contexto para agentes | [AGENTS.md](../../AGENTS.md), [skills](../../skills/README.md) | Verificar instruções e módulos | Instruções não são orquestração multiagente |
| Specs e requisitos testáveis | [specs](../../specs/README.md), [v1.15](../../specs/web-v1-15-hud-settings.md) | Conferir critérios e casos | Uma spec pode ficar obsoleta sem revisão |
| Testes do código real | [harness](../../tests/harness.mjs), [testes Node](../../tests/) | `npm test` | Substitutos de DOM/GPU não provam experiência |
| Navegador e WebGL | [testes Playwright](../../tests/browser/) | `npm run validate -- --browser` | Execução de CI não substitui hardware físico |
| Qualidade da entrega | [workflow CI](../../.github/workflows/ci.yml) | Examinar jobs, dependências e status | YAML sozinho não configura proteção de branch |
| Mudança mobile rastreável | [PR #24](https://github.com/trucco86/nova-wing-3d/pull/24), [testes](../../tests/web-v1-15.test.mjs) | Inspecionar diffs, checks e resultado | Aceite visual humano é independente |
| Commit com pipeline aprovado | [Run #39591873578](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578) | Verificar SHA e conclusão `success` | O status não se aplica a futuros commits |
| Aprendizado após falha | [Execução com falha](https://github.com/trucco86/nova-wing-3d/actions/runs/39590858098) | Comparar SHA e logs com execuções seguintes | Não atribuir causa sem examinar logs |
| Captura real de gameplay | [Screenshot WebGL](../images/boost.png) | Abrir o arquivo de imagem | Screenshot não representa medição de FPS |

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

*Os artefatos do GitHub Actions podem expirar. O commit, o PR, a spec e o changelog funcionam como índices duradouros de proveniência.*
