# Deploy de DEV, HML e PR Preview — Cloudflare Pages

**Estado de referência (25/10/2026 UTC): Cloudflare Pages operacional para DEV, HML e previews independentes.** Este documento substitui a orientação anterior que indicava deploy ainda não configurado. Os deploys abaixo foram confirmados nos logs do Wrangler/GitHub Actions; testes manuais de jogabilidade e OAuth continuam separados.

## Atualização auditada — 28/10/2026

O quadro abaixo supera os snapshots de 25/10 quando houver divergência de versão. O teste funcional e a revisão visual continuam independentes do sucesso da publicação.

| Ambiente | Versão no arquivo `package.json` | Fonte | Evidência recente |
| :--- | :--- | :--- | :--- |
| **DEV** | 1.27.4 | `dev` | [Cloudflare Actions #40744797302](https://github.com/trucco86/nova-wing-3d/actions/runs/40744797302), deployment success |
| **HML** | 1.24.24 | `hml` | Alias publicado; nenhuma promoção da v1.27.x foi comprovada nesta consulta |
| **PROD** | 1.24.18 | `main` | GitHub Pages; v1.27.x não promovida |
| **QA por PR** | Candidata 1.27.5 | [PR #135](https://github.com/trucco86/nova-wing-3d/pull/135) | Isolada, sujeita a quality/browser e revisão |

**Atenção ao ranking:** o repositório já contém código de Worker, cliente e especificações. **Não declarar serviço remoto ativo** sem conferir bindings, D1 e endpoints reais. Ambientes `pages.dev` são acessíveis publicamente por padrão e não constituem autenticação administrativa.

[Visão executiva](PORTFOLIO-AI-SDLC.md) · [Evidências por SHA](case/EVIDENCIAS.md)

## Ambientes e evidências de implantação

| Finalidade                 | Branch de origem                                             | URL alias                                 | Último deploy documentado                                                                                    |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DEV, integrações           | `dev`                                                        | https://dev.nova-wing-preview.pages.dev   | [Run 40146893159](https://github.com/trucco86/nova-wing-3d/actions/runs/40146893159), SHA `e836b14`, sucesso |
| HML, candidata estável     | `hml`                                                        | https://hml.nova-wing-preview.pages.dev   | [Run 40139424519](https://github.com/trucco86/nova-wing-3d/actions/runs/40139424519), sucesso                |
| PR #54, mecha experimental | `feat/nw25-mech-visual-parity`                               | https://pr-54.nova-wing-preview.pages.dev | [Run 40147042554](https://github.com/trucco86/nova-wing-3d/actions/runs/40147042554), build experimental     |
| PR #51, direção visual     | `feat/nw29-stage-color-pass`                                 | https://pr-51.nova-wing-preview.pages.dev | [Run 40147044884](https://github.com/trucco86/nova-wing-3d/actions/runs/40147044884), build experimental     |
| PR #46, joystick mobile    | `fix/mobile-stick-size`                                      | https://pr-46.nova-wing-preview.pages.dev | [Run 40147048485](https://github.com/trucco86/nova-wing-3d/actions/runs/40147048485), build experimental     |
| PR #43, rotas de voo       | `preview-pr-43-flight` (isolada por conflito na PR original) | https://pr-43.nova-wing-preview.pages.dev | [Run 40147162933](https://github.com/trucco86/nova-wing-3d/actions/runs/40147162933), build experimental     |
| PROD, release web          | `main`                                                       | https://trucco86.github.io/nova-wing-3d/  | GitHub Pages, release `v1.24.1` na última verificação                                                        |

Os aliases DEV/HML/PR são **públicos por padrão**; não substituem uma camada de controle de acesso. O hostname confirmado pelo Wrangler não significa que Safari, Android físico, áudio ou Google OAuth foram homologados.

## Infraestrutura implantada

- Workflow de `dev`: `.github/workflows/cloudflare-preview.yml`, `push` em `dev`/`hml`, `pull_request` interna e `workflow_dispatch`.
- Projeto Cloudflare Pages Direct Upload: `nova-wing-preview`; comando `wrangler pages deploy dist --project-name=nova-wing-preview --branch=<branch>`.
- Secrets operacionais são `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no GitHub, nunca no repositório. O workflow testa presença de secrets; **passar uma execução com deploy ignorado não é evidência de publicação**.
- A etapa de upload prepara `dist/index.html`, `.nojekyll` e `BUILD.txt` com SHA e ref. Registrar SHA real e alias reportado na execução.
- Os workflows experimentais de algumas feature branches foram adicionados de modo isolado. Podem divergir do workflow estável e registrar `gate=EXPERIMENTAL_BUILD_ONLY` em `BUILD.txt`.
- O projeto GitHub Pages de PROD usa outro workflow, apenas em `main`, condicionado a `quality` e `browser`.

## Política de gates

- **Preview visual exploratório:** `npm ci`, `npm run build`, `npm run build:check` nas branches experimentais; status marcado como experimental. Verificar se o jogo carrega; screenshots e aceite estético ainda pendentes. CI completa pode permanecer vermelha.
- **DEV estável:** build + validação do código e navegação no alias fixo; branch pode integrar funcionalidades ainda não homologadas visualmente quando intencionalmente isoladas. Conservar evidência por SHA.
- **HML:** promover somente candidata com gates `quality` e `browser` aprovados, revisão de mudanças, smoke e checklist visual/funcional. Não promover mecha não aprovado.
- **PROD:** mesmo commit/artefato homologado, aceite explícito, rollback documentado e deploy GitHub Pages bem-sucedido.

Observação: o workflow Cloudflare de `dev` executa `npm run validate`, mas **não executa sozinho os quatro shards `browser`**. Para HML, essa verificação deve ser exigida pela política de promoção; não considerar sucesso isolado do workflow Cloudflare como qualidade completa.

## OAuth Firebase e isolamento

A integração Google da PR #59 está implantada em DEV. SDK carrega somente nos hosts fixos `dev.nova-wing-preview.pages.dev`, `hml.nova-wing-preview.pages.dev` (quando o código for promovido) e `localhost` com `?auth=1`. Os `pr-N` permanecem sem Firebase para evitar cadastro contínuo de domínios.

**Cloudflare Pages não é a API de ranking**: Workers e D1 ainda não estão provisionados. Ver [AUTH-FIREBASE](AUTH-FIREBASE.md) e [RANKING-CLOUDFLARE](RANKING-CLOUDFLARE.md).

## Runbook — publicar, conferir e reverter

1. Confirmar branch, SHA e gate apropriado antes de merge/deploy. Nunca usar PR com CI vermelha para promover HML/PROD.
2. Abrir o run do GitHub Actions e verificar `Deployment complete!` e `Deployment alias URL` do Wrangler.
3. Abrir `https://<alias>/BUILD.txt` e confrontar `sha`, `ref` e `gate` com o commit verificado. Em `main`, conferir release e GitHub Pages.
4. Executar smoke desktop/mobile, checar console, carregamento, movimento, tiros, nave/robô, sessões e screenshots; registrar resultados como `validado` ou `pendente`.
5. Para rollback, localizar o último SHA bem-sucedido do ambiente, fazer `git revert` ou redeploy do histórico Cloudflare associado ao branch correspondente. **Não usar force push em `main`.** Reexecutar build e smoke, registrando URL e SHA anterior/novo.
6. Se o rollback ainda não foi exercitado, marcar `pendente` e não afirmar que está comprovado.
7. Limpar previews antigos após revisão, conforme política de retenção/custos ainda a definir.

## Limites e backlog

- [ ] Testar recuperação/rollback real de DEV e HML.
- [ ] Automatizar previews para todas as PRs elegíveis a partir de um workflow central, sem cópias divergentes.
- [ ] Expiração/limpeza automática de previews, proteção opcional Cloudflare Access, budgets e limites de deploy.
- [ ] Comparação visual automatizada por SHA, FPS real mobile e testes de áudio.
- [ ] Ajustar o processo de promoção HML para exigir explicitamente resultado `quality`/`browser` do mesmo SHA.

## Candidata de autenticação e ranking (27/10/2026)

A feature de Firebase PROD independente, telas de ranking/histórico e Worker D1 experimental está **em desenvolvimento, sem promoção**. O procedimento, variáveis de configuração pública por ambiente e aprovações estão em [Identity Ranking Delivery](IDENTITY-RANKING-DELIVERY.md). As informações históricas de deploy desta página não comprovam que login OAuth ou score remoto foram validados nos ambientes reais.
