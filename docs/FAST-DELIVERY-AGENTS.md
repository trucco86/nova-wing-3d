# Nova Wing: FAST QA, agentes e orçamento de contexto

Esta proposta é experimental e não altera produção.

## Evidência de gargalo

No CI de 01/11/2026, o job Node terminou em ~0,8 min. Os quatro shards Playwright levaram ~14,1, 12,4, 8,6 e 16,4 min. O deploy isolado levou ~1,1 min. Antes desta mudança, cada shard repetia lint, testes Node, invariantes e build, além de executar Playwright.

## Pipeline de três níveis

| Nível   | Comando                                                     | Uso                                                 |
| ------- | ----------------------------------------------------------- | --------------------------------------------------- |
| FAST    | `npm run test:fast -- --scope=auto`                         | Feedback de desenvolvimento; não valida release     |
| PREVIEW | `npm run build && npm run build:check && npm run test:fast` | Preview Cloudflare isolado, para validação visual   |
| FULL    | `npm run validate` + quatro shards Playwright               | Obrigatório no SHA final antes de merge ou produção |

Os shards FULL passam a executar somente Playwright; os testes Node continuam íntegros no job quality. A seleção FAST sempre inclui testes básicos de jogo/campanha e testes relacionados às fontes alteradas. Novos testes modificados entram automaticamente no FAST.

## Papéis de agentes

**Planner:** spec, critérios de aceite e mapa de arquivos.
**Implementer:** diff limitado e teste FAST.
**QA independente:** revisão de regressão, limitações e evidências.
**Visual QA:** screenshots reais, resolução, FPS e qualidade Alto/Médio.
**Release owner:** gates FULL, autorização e versão final.

Não executar vários agentes alterando o mesmo `src/game.js` ou o mesmo workflow simultaneamente. Handoff compacto: issue, SHA, arquivos, testes, evidências, bloqueios e próxima decisão.

## Redução de contexto e custo

O arquivo `src/game.js` tem mais de 200 mil caracteres. Para evitar reler o arquivo inteiro por tarefa, usar `npm run agent:brief -- --area=stage4 --symbol=updateDevastadorGrandHall --budget=4500`. Outros perfis: mecha, ui, pipeline. Carregar somente skill, spec, trechos relevantes e diff. Exibir erros concretos, não logs inteiros.

**Não temos acesso à fatura nem aos contadores reais de tokens dos modelos.** O limite de caracteres ajuda a reduzir o contexto enviado, mas não comprova percentual de economia monetária. Instrumentar, quando possível, área, SHA, caracteres de contexto, arquivos lidos, chamadas, modelo, input/output/cache tokens, duração e custo real do provedor.

## Próximas medições

Comparar antes/depois para tempo até primeiro preview, p50/p95 dos shards, duração FULL, commits de sincronização, taxa de regressão e custo por mudança aceita. Rebalancear shards por duração real é a próxima oportunidade P1; não aumentar workers ou retirar asserts sem medir.

**Gate:** preview e FAST jamais significam autorização para produção. Exigir quatro shards Playwright, qualidade e aceite visual no SHA final.
