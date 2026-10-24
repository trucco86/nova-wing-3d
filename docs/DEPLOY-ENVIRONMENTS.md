# Deploy de DEV, HML e PR Preview — Cloudflare Pages

Status: workflow preparado; **não publicado** até conectar uma conta Cloudflare e configurar credenciais.

## Configuração única pelo mantenedor

1. Crie um projeto **Cloudflare Pages** chamado `nova-wing-preview` (Direct Upload; não conecte uma publicação automática de produção).
2. No GitHub, configure os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`. O token deve ter permissão mínima de edição do Cloudflare Pages na conta escolhida. Não coloque tokens no código nem em comentários de PR.
3. Confira em Settings → Environments o ambiente `nova-preview` (se desejar, aplique revisores obrigatórios; **não** reutilize `github-pages`).
4. Integre o workflow após revisão. O push nas branches `dev` e `hml` publicará suas versões; PRs internas terão deploy `pr-N`.
5. Verifique a URL real retornada pelo job de deploy e registre o SHA de `BUILD.txt`. Não anuncie URL de preview antes de receber sucesso da hospedagem.

## Isolamento

- O Pages da produção atual não é usado por este workflow.
- PRs de forks não recebem secrets.
- `npm run validate` e `npm run build` são gates antes de publicar.
- A branch `hml` deve receber apenas candidatas aprovadas para homologação, sem merge automático em `main`.
- A branch `dev` pode receber mudanças em integração.
- O preview de PR serve à revisão; não equivale à aprovação do mantenedor.
- Reversão: republicar o commit anterior no branch correspondente ou usar rollback do Cloudflare Pages.

## Critérios para concluir

- Uma URL DEV, uma HML e uma da PR #54 acessíveis no desktop e mobile.
- Build SHA identificado e diferente de PROD.
- Capturas de gameplay e teste de áudio/transformação do robô.
- Nenhum deploy altera o GitHub Pages de produção.
