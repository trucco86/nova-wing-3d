# HML — smoke test pós-deploy de Cloudflare Pages

## Objetivo
Depois da publicação de `hml`, garantir automaticamente que os arquivos
públicos vistos no hostname fixo pertencem ao commit liberado e que a
configuração de leitura é consistente, sem autenticação nem alteração de dados.

## Critérios
- Consultar **somente** `https://hml.nova-wing-preview.pages.dev`, por HTTPS.
- Checar `BUILD.txt` com `sha=GITHUB_SHA` e `ref=refs/heads/hml`.
- Garantir documento HTML do jogo, `nova-config.json` JSON válido para HML
  e sem fallback para configuração de produção.
- Distinguir Firebase de DEV versus projeto HML dedicado, como informação
  operacional sem mostrar API key ou ID token.
- Se `rankingApiUrl` estiver configurado, exigir `GET /v1/health` com
  `status=ok`. Se ausente, emitir **aviso**: não fingir gravação remota.
- Repetir leitura de arquivos públicos enquanto CDN propaga (tentativas
  limitadas); não afrouxar a comparação do SHA.
- Requisições sem Authorization nem cookies; **nunca** enviar POST ou DELETE.
- Executar apenas em `push` da branch `hml`, após sucesso do deploy;
  em PRs, DEV, HML não publicado ou PROD o passo não roda.
- Testes de contrato com respostas simuladas e falhas de SHA, HTML e config.

## Limites
Esse smoke **não** testa login real, OAuth, consentimento, tabelas D1, exclusão,
escrita habilitada, mobile ou desempenho do jogo. Esses testes pertencem à
homologação com pessoas e ambientes reais (#119). Sem upgrade em `main`.
