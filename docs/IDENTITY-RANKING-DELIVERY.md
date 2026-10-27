# Login Google e histórico de pontuação — DEV / HML / PROD

> **Candidata de desenvolvimento.** Código, testes e automação disponíveis na branch de feature. Este arquivo **não comprova** que o projeto Firebase PROD existe, que o Google OAuth foi homologado, que Workers/D1 foram provisionados ou que as pontuações foram armazenadas remotamente.

## Arquitetura e experiência

1. Firebase Authentication com Google identifica o jogador opcionalmente. Visitantes continuam jogando.
2. O cliente registra automaticamente, após derrotar o chefe e liberar a fase, a pontuação **incremental da fase** e sua duração no armazenamento local `nova-wing-score-history-v1`. Até 100 resultados; o checkpoint `nova-wing-3d-v1` não é alterado.
3. Só após **login + apelido + consentimento explícito** uma run é iniciada remotamente. Não enviar scores antigos como se fossem runs verificadas.
4. Cloudflare Worker verifica assinatura RS256 do ID token do projeto Firebase correspondente ao ambiente e só grava no binding D1, sem expor token/UID/e-mail em respostas públicas.
5. Na vitória, o cliente envia o identificador e nonce da run, score e duração. Worker aplica limites, expiração, rate limit e atualização atômica anti-replay.
6. Histórico por usuário: `GET /v1/me/history`; ranking público experimental: `GET /v1/leaderboard?mode=experimental`. Só nickname, pontos, setor, data.
7. A classificação **experimental não é uma competição verificada**: uma aplicação no navegador não comprova integridade de gameplay. O leaderboard oficial, que lê apenas resultados marcados `verified`, permanece separado.

## Separação de ambientes

| Ambiente | Site | Identidade | Ranking |
| --- | --- | --- | --- |
| DEV | `https://dev.nova-wing-preview.pages.dev` | Firebase DEV `nova-wing-dev`; autorizado externamente | Worker/D1 DEV independente, quando provisionado |
| HML | `https://hml.nova-wing-preview.pages.dev` | Firebase HML específico se informado; na ausência usa DEV (sem contaminar PROD) | Worker/D1 HML independente |
| PROD | `https://trucco86.github.io/nova-wing-3d/` | **Firebase PROD separado obrigatório**. Falta de configuração desabilita SDK e login | Worker/D1 PROD independente |
| Previews de PR | `https://pr-N.nova-wing-preview.pages.dev` | SDK Google desativado intencionalmente | somente histórico local, sem credenciais PROD |
| Native/offline | Android/iOS | SDK Web desativado | histórico local e gameplay sem rede |

O hostname controla apenas se o cliente renderiza OAuth. **Não é autorização**. Worker valida o Firebase ID token e usa `FIREBASE_PROJECT_ID` do próprio ambiente.

## Configuração obrigatória antes de funcionar no ambiente real

### 1. Firebase Console

- No Firebase HML/DEV, habilitar provedor **Google** e autorizar `hml.nova-wing-preview.pages.dev` em Authentication > Settings > Authorized domains.
- Criar/selecionar **projeto Firebase PROD separado de `nova-wing-dev`**, registrar app Web e habilitar Google Sign-In.
- Autorizar exatamente `trucco86.github.io` no projeto PROD. Configurar o domínio OAuth e testar popup e fallback redirect. Não basta autorizar o repositório GitHub.
- Configuração Web pública (não é uma service-account JSON; não guardar tokens privados):

```json
{
  "apiKey": "YOUR_PUBLIC_FIREBASE_WEB_API_KEY",
  "authDomain": "YOUR_PROD_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROD_PROJECT",
  "appId": "YOUR_WEB_APP_ID"
}
```

- Armazenar o JSON público em **GitHub Actions Variables** `NOVA_FIREBASE_PROD_CONFIG_JSON`, não em HTML versionado. Opcionalmente criar `NOVA_FIREBASE_HML_CONFIG_JSON` para outro projeto HML e `NOVA_FIREBASE_DEV_CONFIG_JSON` para DEV.
- O deploy do GitHub Pages gera `nova-config.json` para PROD apenas com dados válidos. Se faltar a variável, **login e ranking remoto ficam inativos**, sem usar usuários DEV. HML/DEV recebem `nova-config.json` gerado pelo workflow Cloudflare.

### 2. Cloudflare D1 e Worker

- Criar bancos D1 **distintos** `nova-wing-ranking-hml` e `nova-wing-ranking-prod`; preservar cada UUID no GitHub Actions Variable correspondente: `NOVA_RANKING_HML_D1_ID`, `NOVA_RANKING_PROD_D1_ID`. Para PROD, registrar também `NOVA_RANKING_PROD_FIREBASE_PROJECT_ID`; para HML, `NOVA_RANKING_HML_FIREBASE_PROJECT_ID` (usar `nova-wing-dev` apenas se HML compartilhar identidade de testes).
- Conceder no Cloudflare token usado no GitHub os escopos mínimos para **Workers Scripts + D1**; as credenciais `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` são **GitHub secrets**, nunca código.
- Revisar migrations `workers/ranking/migrations/0001_initial.sql` e `0002_provisional_history.sql`. Aplicar somente contra banco correto. A migration não popula temporadas nem promove resultados não verificados ao ranking oficial.
- Após integração/revisão, utilizar o workflow manual `Deploy ranking Worker and D1 migrations (manual approval)`, escolher HML, escrever `DEPLOY-HML`, manter/desabilitar `enable_experimental_writes` até aprovação. O fluxo aplica migrations localmente e depois remotamente, e publica o Worker. Configurar proteções de aprovação na environment `nova-ranking-hml`.
- Em produção, escolher PROD, escrever `DEPLOY-PROD`, e exigir **aprovadores de produção** na environment `nova-ranking-prod`. O workflow falha fechado se não houver ID/projeto/token.
- Copiar a URL base HTTPS real do Worker nas variáveis `NOVA_RANKING_HML_API_URL` e `NOVA_RANKING_PROD_API_URL`. Quando ausentes, o frontend continua salvando scores **apenas localmente**. Para testes DEV configurar `NOVA_RANKING_DEV_API_URL` somente se um Worker DEV separado realmente existir.
- Após mudar variáveis, republicar o Cloudflare HML e/ou a release PROD: os arquivos `nova-config.json` são gerados no deploy, não no navegador.

### 3. Homologação obrigatória

- Abrir HML em desktop e mobile, entrar Google, recarregar, sair, voltar para visitante, testar redirect popup e cancelar login.
- Iniciar fase já autenticado e com nickname+consentimento marcados; derrotar chefe; verificar pontuação local; verificar a resposta `recorded:true, verified:false` do Worker e a linha D1.
- Reabrir HML em outro dispositivo; conferir histórico remoto usando **a mesma conta**, sem importar checkpoint local automaticamente.
- Testar nickname duplicado, CORS de outro domínio, JWT DEV enviado a PROD, token inválido, replay de run, run de outro UID, tempo inviável, limite de taxa, indisponibilidade da API e eliminação de dados.
- Confirmar que preview de PR não carrega SDK nem envia token, que as páginas não exibem e-mail/UID e que o centro do gameplay continua livre em 390 × 844 e 844 × 390.
- Validar migração, custo, retenção, exclusão e rollback antes de PROD.
- Registrar evidências com SHA/CI e **aceite humano**. Nunca inferir homologação real do teste com SDK simulado.

## Segurança, confiança e LGPD

- O consentimento remoto é explicitamente opt-in e o nickname é informado pelo jogador; Google displayName não é publicado automaticamente.
- O histórico local fica no dispositivo. O Worker não possui acesso ao checkpoint ou ao e-mail, e `DELETE /v1/me` exclui o perfil e dados vinculados ao jogador autenticado. A interface ainda precisa de controles explícitos para solicitar exclusão, e uma política de retenção pública antes de PROD.
- A verificação autoritativa de eventos/replay e proteção robusta contra múltiplas contas são **pendências** para transformar o ranking experimental em oficial.
- Não considerar arquivo de configuração público segredo: Firebase API key de app Web identifica projeto, mas autorização real depende das regras de Firebase Auth e da verificação do token no backend.

## Verificação técnica

```sh
npm run validate
npm run test:browser
```

A automação de release continua exigindo build reproduzível, changelog, notas e gates CI. Este trabalho deve ser promovido isoladamente, sem incluir mudanças experimentais de outras PRs.
