# ADR-0003 — Build reproduzível em cada runner e gates separados de preview

- **Data:** 2026-10-25
- **Estado:** parcialmente adotada (pipeline corrigido); automatização de versões pendente

## Contexto

Na PR #59, a validação passou por erros sucessivos de estilo, versão distribuída e duas versões de iOS, mas a falha de CI mais custosa ocorreu porque os quatro runners Playwright independentes tentavam verificar uma versão do HTML que **não tinham gerado**. Em seguida, os testes de navegador revelaram uma sobreposição mobile real e carregamento do Firebase em um shell offline.

## Decisão

- Cada runner do gate browser instala dependências, executa `npm run build` e só então `npm run validate -- --browser`. Não usar artefato gerado em outro runner implicitamente.
- Teste de regressão `tests/ci-workflow.test.mjs` protege a ordem `npm ci → build → validate`.
- `quality` valida formatação, lint, Node tests, versão, build reproduzível e invariantes; `browser` agrega os quatro shards.
- Proteger invariantes reais de produto com Playwright, inclusive controles mobile e Android offline, sem desativar testes ou expandir timeout para encobrir bugs.
- Previews experimentais podem usar gate de build reproduzível e gerar `BUILD.txt` marcado como experimento; nenhum preview substitui os gates `quality/browser` da promoção.
- A publicação do GitHub Pages continua restrita a `main` e condicionada ao gate `browser`.

## Evidência

- SHA `41c4d98` da PR #59: CI success em https://github.com/trucco86/nova-wing-3d/actions/runs/40146116297; 139 testes Node e quatro shards Playwright aprovados.
- Cloudflare PR preview success em https://github.com/trucco86/nova-wing-3d/actions/runs/40146116302.
- O shard 3 validou regressões mobile/Android offline após correções reais de UI e carregamento de SDK.

## Consequências e próximos passos

- Maior reprodutibilidade e rastreabilidade de falha por runner.
- O versionamento ainda exige sincronização manual de `package.json`, lockfile, `index.html`, release notes e campos Xcode `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`; criar comando idempotente e teste de consistência antes da próxima release.
- A CI pode ser verde sem homologação física, sensorial ou OAuth; relatórios não substituem revisão do mantenedor.
- Proteção de branch e regras de merge precisam ser verificadas nas configurações remotas do GitHub, e não inferidas de arquivos `CODEOWNERS`.
