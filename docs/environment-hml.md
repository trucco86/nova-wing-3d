# Ambiente HML — homologação

- **Branch:** `hml`
- **Host Cloudflare Pages:** https://hml.nova-wing-preview.pages.dev
- **Projeto de deploy:** `nova-wing-preview`; separado do GitHub Pages PROD
- **Último deploy documentado:** [run 40139424519](https://github.com/trucco86/nova-wing-3d/actions/runs/40139424519), baseline `v1.24.1`
- **Firebase Google Authentication:** o código de `src/google-auth.js` suporta o host HML, **mas a integração #59 ainda não havia sido promovida para `hml`** nesta evidência; não alegar login operacional em HML.
- **Ranking:** nenhum Worker/D1 provisionado ou score público remoto.
- **Política:** HML recebe candidata após quality + quatro browser shards, validação visual/funcional e revisão; nunca importar automaticamente as PRs experimentais ainda não homologadas.

Sempre conferir `BUILD.txt`, SHA no GitHub e logs de deploy para estado atualizado. Mais informações em [DEPLOY-ENVIRONMENTS](DEPLOY-ENVIRONMENTS.md), [AUTH-FIREBASE](AUTH-FIREBASE.md) e [RANKING-CLOUDFLARE](RANKING-CLOUDFLARE.md).
