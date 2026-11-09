# NW-14 — Handoff para revisão por agente

Status: segundo incremento local, sem publicação.

## Resultado esperado

Completar a passagem validação → revisor independente → retorno ao implementador
ou encaminhamento para CI. A coordenação do agente usa o runtime disponível no
chat; o repositório fornece um contrato verificável de entrada e saída, sem exigir
API key, provedor ou modelo fixo.

## Comportamento

- `agent:orchestrate request-review <runId> <implementerId>` aceita somente uma
  execução `awaiting-review`, com gates completos, SHA/digest coerentes e fonte
  ainda atual. Preserva uma solicitação única em
  `artifacts/orchestrator/<runId>/reviews/<requestId>/request.json`.
- A solicitação inclui spec, contexto, evidências, identidade declarada do
  implementador, limites de atuação e formato do parecer. O runtime entrega esse
  contrato ao agente revisor, que escreve `response.json` no mesmo diretório.
- `agent:orchestrate record-review <runId> <requestId>` verifica identidade
  diferente da do implementador, identificadores da execução, SHA/digest, estrutura
  do parecer e atualidade da fonte. Preserva `review-result.json` e `outcome.json`.
- PASS sem achados altos/críticos nem checks falhos produz `awaiting-ci`;
  FAIL produz `changes-requested`; BLOCKED, contrato divergente ou fonte alterada
  produzem `blocked`. `releaseReady` permanece `false` em todos os casos.
- Tentativas são imutáveis após registro. Repetir a gravação é erro; uma nova
  revisão usa outra solicitação, preservando a história anterior.
- O contrato não permite caminho fora dos artefatos da execução, nem seguir
  symlinks nesses artefatos. IDs não podem ser caminhos.

## Critérios observáveis

1. Execução com validação falha, relatório adulterado/incompleto ou fonte alterada
   não gera solicitação. Uma revisão antiga não aprova uma fonte nova.
2. Parecer sem evidência, com identidade igual à do implementador, IDs divergentes,
   PASS contraditório ou campos inválidos é bloqueado.
3. PASS, FAIL e BLOCKED fazem handoffs distintos sem alterar o handoff original
   da validação nem aprovar CI/publicação.
4. Conteúdo de specs e pareceres não é executado como shell nem usado para escolher
   permissões. A solicitação instrui revisão sem editar fontes, publicar ou ler
   credenciais; os limites efetivos são os do runtime, não do JSON.
5. Testes isolados cobrem contratos, erro, repetição, caminhos, identidade e
   mudança de fonte entre solicitação e parecer.
6. Demonstrar uma revisão real no runtime deste chat e preservar o parecer da
   mesma versão que passou nos gates locais.

## Limites de confiança

IDs de agentes e resultados são declarações recebidas do runtime. Os arquivos são
locais, não assinados, e não provam identidade por si só. O responsável pelo
runtime garante que o revisor seja outro agente. O comando não é um bot residente
e não chama modelos automaticamente; a chamada ao agente fica no runtime.
CI protegida, merge, homologação e publicação continuam etapas separadas.

## Verificação

- `node --test tests/agent-review.test.mjs tests/orchestrator.test.mjs`
- `npm run format`, `npm run build`, `npm run validate`
- Fluxo real: `check` → `request-review` → agente revisor → `record-review`.
