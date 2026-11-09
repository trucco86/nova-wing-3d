---
name: nova-wing-aceleracao
description: Aplicar FAST, QA e FULL gates e delegar desenvolvimento do Nova Wing com contexto e custo de tokens limitados.
---

# Nova Wing — Aceleração e orquestração de agentes

## Quando usar

Mudanças frequentes de gameplay, gráficos, HUD, testes ou workflows; especialmente para tarefas curtas em PRs de QA. Leia primeiro `AGENTS.md` e `skills/nova-wing-qa/SKILL.md`. Esta skill complementa QA, não a substitui.

## Budget de contexto

1. Comece com `npm run agent:brief -- --area=stage4 --symbol=createDevastadorGrandHall --budget=4500`. Escolha `stage4`, `mecha`, `ui` ou `pipeline`.
2. Leia somente a especificação pertinente, uma skill de domínio e trechos da implementação por símbolo/linhas. Não cole `src/game.js` completo; evite replicar arquivos inteiros nos comentários e nas chamadas de ferramenta.
3. Prefira `git diff --stat`, `git diff --check`, `git diff -- <arquivos afetados>`, `rg -n '<símbolo>' src` e logs filtrados com erros. Expanda o contexto somente para investigar uma falha concreta.
4. Registre `contextChars`, área, número de arquivos lidos e quantidade de tool calls por tarefa. **Não confundir caracteres/4 com tokens reais faturados**; sem dados do provedor, custos são estimativas não verificadas.
5. Não instancie cinco agentes com o mesmo contexto completo. Use handoffs curtos e artefatos estáveis por SHA.

## Papéis por tarefa (não são processos autônomos em execução)

- **Planner**: devolve escopo, critérios verificáveis, dependências e mapa pequeno de arquivos. Uma vez por pacote.
- **Implementer**: aplica mudança localizada e faz `test:fast`; devolve diff resumido, SHA, testes direcionados e limitações.
- **QA independente**: revisa contratos, testes, riscos, regressões; rejeita mascaramento de falhas.
- **Visual QA**: compara capturas de dois tamanhos e perfis Alto/Médio, checa FPS/oclusão do HUD, reporta evidência visual real.
- **Release owner**: exige CI FULL do SHA final, homologação humana e confirmação de ambiente; somente ele recomenda promoção.

Os papéis podem ser executados sequencialmente por um único agente; paralelismo só quando arquivos e estado são independentes. Evite múltiplos agentes alterando `src/game.js`, o mesmo workflow ou a mesma branch ao mesmo tempo.

## Gates em três níveis

- **FAST local:** `npm run test:fast -- --scope=auto` (ou `stage4`, `mecha`, `mobile`, `graphics`, `audio`). Falha cedo e gera `artifacts/fast-validation.json`, explicitamente **não é certificação de release**.
- **QA preview:** `npm run build && npm run build:check && npm run test:fast`, no Cloudflare isolado. Permite feedback visual antes de E2E; não publica em main.
- **FULL:** `npm run validate` (todos os testes Node/linters/invariantes/build) e **todos os quatro shards Playwright reais**. Gates e visual mobile precisam estar verdes no SHA final antes de merge.

Nunca remover ou pular a suíte FULL para conseguir publicar produção. Falha de FAST bloqueia o preview, mas não deve ser reportada como falha da suíte completa.

## Handoff mínimo

`{issue, sha, scope, alteredFiles, testsRun, testsPending, visualEvidence, blockers, nextAction}`. Não enviar logs integrais se `status + falhas concretas + link dos artefatos` resolve. Se o SHA mudou após a última validação, refaça a verificação aplicável.

## Métricas

Meça duração p50/p95 de FAST, preview, cada shard e FULL; número de commits de sincronização; taxa de falha repetida; tempo até primeiro preview; número de arquivos e caracteres de contexto. Só declarar redução de custo de token com dados reais de uso, preços e modelo por execução.
