# Ranking — limite de payload HTTP em bytes (P0 segurança operacional)

## Contexto

A PR #107 adiciona `POST /v1/runs/start` e `/v1/runs/finish` para pontuações
experimentais. O leitor anterior usava `request.text()`, verificava apenas
`text.length` e confiava parcialmente em `Content-Length`. Um payload UTF-8
com caracteres multibyte ou upload em streaming poderia ultrapassar o orçamento
de 2 KiB antes da rejeição.

## Contrato observável

- Um corpo JSON com mais de **2048 bytes de UTF-8** recebe HTTP 400
  `INVALID_BODY`, antes de consultas SQL.
- O limite se aplica igualmente a streams sem `Content-Length` e a cabeçalhos
  falsos ou incorretos. Cabeçalhos malformados também são rejeitados.
- O servidor não lê o restante de um stream já excedido: cancela o reader.
- JSON válido com exatamente 2048 bytes continua aceito, sujeito aos demais
  gates existentes de identidade, consentimento, rate limit e validação.
- JSON malformado, UTF-8 inválido e arrays continuam rejeitados.
- Nenhuma alteração no cliente, no modelo de D1, na experiência mobile ou na
  lógica de anticheat; score remoto continua **experimental e não verificado**.

## Matriz de regressão

- UTF-8 multibyte acima de 2048 bytes, mesmo com menos de 2048 caracteres.
- Stream limitado a poucos chunks lidos antes de cancelar upload maior.
- `Content-Length` falso, inválido ou ausente.
- Payload JSON de exatamente 2048 bytes com consentimento explícito.
- Verificar que as recusas não consultam D1 e a pontuação oficial não muda.

## Evidência e liberação

Suíte: `tests/ranking-body-limit.test.mjs`. Este documento não atesta CI,
testes de carga no Cloudflare Worker, autenticação real ou deploy. Integrar
na feature de ranking apenas após checks do SHA final; não promover PROD
antes de Firebase/D1, revisão de privacidade e homologação presencial.
