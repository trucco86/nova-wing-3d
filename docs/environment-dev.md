# Ambiente DEV — integração

- **Branch:** `dev`
- **Host Cloudflare Pages:** https://dev.nova-wing-preview.pages.dev
- **Projeto de deploy:** `nova-wing-preview` (independente do GitHub Pages PROD)
- **Último deploy verificado:** [run 40146893159](https://github.com/trucco86/nova-wing-3d/actions/runs/40146893159), SHA `e836b14` (PR #59 integrada)
- **Firebase:** Google Authentication implementado, SDK ativo no host DEV; login/redirect/logout reais aguardam homologação humana.
- **Score:** progresso local. Nenhuma API Worker/D1 publicada.
- **Política:** DEV aceita integração experimental com gates e evidência; não promove automaticamente a HML/PROD.

Documentação completa: [DEPLOY-ENVIRONMENTS](DEPLOY-ENVIRONMENTS.md), [AUTH-FIREBASE](AUTH-FIREBASE.md) e [RANKING-CLOUDFLARE](RANKING-CLOUDFLARE.md).
