# ADR-0001 — Ambientes isolados para desenvolvimento e publicação

- **Data:** 2026-10-24/25
- **Estado:** adotada e parcialmente operante; rollback ainda não exercitado
- **Escopo:** distribuição Web do Nova Wing

## Contexto

O único endereço de GitHub Pages de produção não permitia revisar o comportamento do robô, efeitos, controles mobile e aparência antes de expor alterações aos jogadores. O fluxo precisava de links de preview independentes, DEV contínuo e HML para aceite.

## Decisão

- GitHub `main` → GitHub Pages PROD, com `quality`, `browser`, revisão e aceite.
- GitHub `dev` e `hml` → Cloudflare Pages, projeto de Direct Upload `nova-wing-preview`, aliases `dev.` e `hml.`.
- PRs internas → Cloudflare Pages alias `pr-N.` para demonstrações isoladas; rollout progressivo sob responsabilidade do mantenedor.
- PRs de terceiros/forks não recebem secrets por padrão.
- Os previews experimentais exigem build reproduzível e se identificam como `EXPERIMENTAL_BUILD_ONLY`; **não são candidatos automaticamente homologados**.
- HML e PROD continuam exigindo gates completos e teste de experiência; nenhum deploy de preview promove automaticamente para `main`.

## Evidência

- DEV: https://github.com/trucco86/nova-wing-3d/actions/runs/40146893159 (alias emitido por Wrangler).
- HML: https://github.com/trucco86/nova-wing-3d/actions/runs/40139424519.
- Previews #54, #51, #46, #43: ver [DEPLOY-ENVIRONMENTS](../DEPLOY-ENVIRONMENTS.md) e [issue #56](https://github.com/trucco86/nova-wing-3d/issues/56).
- PR #59 autenticação integrada em DEV sem alterar GitHub Pages.

## Consequências e riscos

- Positivo: ciclos de feedback visual mais curtos, isolamento por mudança, aliases estáveis adequados ao OAuth e menor chance de liberar arte inacabada.
- Negativo: sites de preview são publicamente acessíveis por padrão, manutenção de tokens/permissões, possível gasto e necessidade de limpeza.
- Pendente: rollback testado, política de expiração, comparação automatizada de screenshots e automação central de PR previews.
- **Não confundir** URLs de Pages com API Worker/D1; nenhuma delas prova que ranking funciona.

## Alternativas

- Usar GitHub Pages para todas as etapas — rejeitado porque mistura testes com canal público de release.
- Exigir um cadastro OAuth por PR — rejeitado por custo operacional e risco de configuração.
