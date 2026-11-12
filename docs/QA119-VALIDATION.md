# QA119 | Evidências e estado de homologação

- Branch: `feat/qa119-surface-geology-and-caverns-20261112`
- Base: QA118, PR #329, já validada via quatro shards Playwright.
- Versão: `1.27.119`, sincronizada automaticamente pelo workflow `QA119 prepare geologic scenes candidate`.
- Preparação: https://github.com/trucco86/nova-wing-3d/actions/runs/43310202128
  - `npm ci`, `release:prepare`, `npm run format`, `npm run build`, sete arquivos de regressão geológica e `npm run validate`: sucesso.
  - `index.html`, `package.json` e arquivos de versão atualizados pela própria automação. Nenhum deploy de produção.
- Audit real WebGL: https://github.com/trucco86/nova-wing-3d/actions/runs/43310056775
  - 8 testes Playwright aprovados em desktop e mobile: Marte, travessia do asteroide, superfície de Europa e QA114 de orçamento da cidade.
  - Triângulos extras QA114: desktop 13.944/777.242 (1,79%); mobile 17.124/764.434 (2,24%). Desenhos incrementais: oito em ambos. Limite original de 3% preservado.
  - Capturas e traces em `qa119-geology-screenshots-traces`, vinculados ao workflow.
- Pendentes: CI FULL no SHA final após a sincronização do pacote (4 shards e quality), verificação de preview Cloudflare atualizado e aprovação artística/física em hardware real. A auditoria focal é evidência parcial, não substitui a CI FULL.
- PR: https://github.com/trucco86/nova-wing-3d/pull/330 (Draft, sem autorização de merge/produção).

## Escopo
Marte: cinco mesas esculpidas com 20 faixas sedimentares em cinco lotes. Asteroide: veios minerais aderidos à parede em vez de aros artificiais, mesma contagem de draw calls. Europa: cristas facetadas em um único lote instanciado, túnel e arena do chefe intactos.

## Não afirmar
Não chamar de entrega AAA final; não extrapolar FPS real de celular a partir de Chromium; não considerar completa a QA visual de chefes e transições de todas as dez fases.
