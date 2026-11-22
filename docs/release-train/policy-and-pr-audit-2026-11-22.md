# Nova Wing Release Train | Política proposta e auditoria inicial (22/11/2026)

## Estado e regras de segurança
- **Não ativar auto-merge em nenhuma PR existente até confirmar branch protection/rulesets de main e os checks obrigatórios.** A API de leitura disponível não expõe esses controles; não presumir que estejam configurados.
- Repositório: auto-merge permitido no nível do repositório; `allow_update_branch=false`. Isso não comprova proteção da `main`.
- CI em `main`: Quality -> seis shards Playwright -> agregador browser -> GitHub Pages -> Release. **O merge em main já dispara publicação**, portanto auto-merge equivale a autorizar produção com o pipeline atual. Isso conflita com a política de aprovação por lote.
- **Pré-requisito obrigatório:** separar integração e deploy. Migrar publicação Pages/Release para workflow `workflow_dispatch` com aprovação por lote e ambiente protegido, ou implementar um gate equivalente comprovadamente efetivo. Só depois habilitar auto-merge de baixo risco.
- Jamais permitir bypass de required checks, force push, ou deploy por PR.
- Lotes de produção aprovados explicitamente pelo proprietário; smoke test em produção e rollback documentado.
- Limite de WIP: três PRs ativas, branches a partir de main, preferir squash merge e PRs pequenas.

## Matriz de risco
| Categoria | Exemplos | Integração futura | Publicação |
|---|---|---|---|
| Baixo | documentação, testes isolados, ajustes não executáveis | automática **somente após** branch protegida, CI verde e deploy desacoplado | por lote aprovado |
| Médio | HUD, assets, cenários, gameplay localizado | revisão humana e CI completa | por lote aprovado |
| Alto | engine, colisão, save, pagamentos, auth, CI, workflows, versão, release | revisão humana obrigatória | por lote aprovado e smoke test |
| Crítico | segurança, permissões, alteração do pipeline de deploy | aprovação explícita | aprovação explícita |

## Auditoria inicial: triagem sem fechamento
A busca GitHub retornou 100 PRs (limite da consulta), portanto **não é uma contagem exaustiva**. A classificação é preliminar, por título, base, estado e descrição. Antes de encerrar qualquer PR, comparar diff/commits e confirmar ausência de alterações exclusivas.

### Manter como candidatas de integração, NÃO mergear automaticamente
- #431: Europa Premium + reator/HUD/colisões, v1.27.160, base main, draft, sem conflito no snapshot. **Revisar sobreposição com #430 e #426 antes de eleger candidata**.
- #430: HUD reator + colisões Europa, v1.27.159, base main, draft, sem conflito. Potencialmente absorvida pela #431; confirmar via comparação de diff.
- #419: fase 3, Perfurador e performance, PR encadeada, draft. Rebase e revisão antes de integração.
- #413: hangar/chefes, encadeada, com conflito. Reconciliação em PR nova e pequena.
- #414: identidade visual, com conflito. Revisar diff, separar por fase e rebase.

### Candidatas a encerramento por substituição, condicionado a diff
- #423 e #424: contrato e runtime antigos do reator, consolidados funcionalmente em #425 (já merged).
- #418, #417, #416, #415: cadeia de exploração anterior; verificar conteúdo exclusivo não incorporado pela #425.
- #429: correção HUD encadeada na branch antiga #425; verificar absorção em #430/#431.
- #426: correção isolada de colisões com conflito; verificar absorção integral em #430/#431 antes de fechar.
- #412, #411, #410, #409 e demais QA antigos: comparar com main e release atual, não inferir que estejam incorporados pelo número da versão.

### Auditoria em lotes
1. Inventariar **todas** as PRs abertas com paginação e data de atualização.
2. Para cada PR: base/head, commits exclusivos vs main, arquivos, CI atual, risco e PR sucessora.
3. Marcar: `ready`, `needs-rebase`, `superseded-pending-diff`, `blocked`, `archive-candidate`.
4. Apresentar relatório e links para aprovação antes de fechar PRs.
5. Manter no máximo três PRs ativas; as demais permanecem em backlog ou aguardam decisão.

## Critérios de aceite para automação
- [ ] Confirmar proteção da main, required checks, reviews e restrições de bypass
- [ ] Desacoplar Pages/Release de push automático em main, com aprovação por lote
- [ ] Garantir que checks obrigatórios rodem em PR e na fila de merge
- [ ] Classificador de risco conservador, com alterações desconhecidas classificadas como médio/alto
- [ ] Ativar auto-merge apenas em PRs novas de baixo risco, nunca em lote retroativo
- [ ] Dashboard com lead time de PR, WIP, frequência de deploy e falha pós-deploy
- [ ] Documentar rollback e validar o fluxo com uma PR de documentação antes de escalar

**Nenhuma PR foi encerrada ou publicada como parte desta auditoria.**
