# Métricas e avaliações de contratos

As APIs locais de NW-14/NW-15 preservam relatórios por UUID. Não publicam,
alteram remotos, executam modelos ou autorizam release. A especificação é
[NW-14](../specs/nw-14-maturity-pack.md).

## APIs e execução

```js
import { collectMetrics, summarizeJobs } from '../tools/orchestrator-metrics.mjs';
import { evaluateContracts } from '../tools/orchestrator-evals.mjs';

const metrics = collectMetrics({ root, jobs });
const queueSummary = summarizeJobs(jobs); // API pura, sem acesso à fila ou disco
const evaluation = evaluateContracts({ root });
```

`root` é a raiz do repositório e assume `process.cwd()` quando omitido. `jobs`
assume `[]`; o chamador fornece a fotografia de `listJobs({root})`. O módulo de
métricas não importa nem modifica a fila. Ambos os relatórios retornam
`schemaVersion: 1`, identificador, limitações, `releaseReady: false`, `directory`
e `reportPath`. Os JSONs usam criação exclusiva, sem sobrescrever relatório.

- Métricas: `artifacts/orchestrator/metrics/<UUID>/metrics.json`.
- Avaliações: `artifacts/orchestrator/evaluations/<UUID>/evaluation.json`.

Para feedback direcionado:

```sh
node --test tests/orchestrator-metrics.test.mjs tests/orchestrator-evals.test.mjs
```

Esse comando verifica os módulos; não substitui FAST, FULL, revisão independente,
CI dos quatro shards ou aceite humano.

## Fontes e significado das métricas

O leitor considera somente estes nomes sob `artifacts/orchestrator`:

| Local permitido                                             | Conteúdo usado                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `<UUID>/handoff.json`                                       | Estado e duração da validação                                      |
| `<UUID>/validation.json`                                    | Checks vinculados ao SHA/digest do handoff                         |
| `<UUID>/reviews/<UUID>/request.json` e `outcome.json`       | Solicitação, resultado e tempo entre criação e registro do parecer |
| `<UUID>/ci/ci-observation.json` e `github-run.json`         | Evidência CI histórica                                             |
| `operations/<UUID>/ci-observation.json` e `github-run.json` | Observações CI do módulo de operações                              |

Não há varredura recursiva genérica. Nomes arbitrários e diretórios sem UUID não
são lidos. Symlinks de arquivos são rejeitados; ancestrais redirecionados impedem
a coleta/escrita. Cada JSON de entrada tem limite de 256 KiB. Arquivos inválidos,
schemas desconhecidos e identidades divergentes aparecem em `ignored`; ausência
de arquivo não comprova sucesso. UUIDs de execução e solicitação precisam
corresponder aos respectivos diretórios. O limite é uma proteção local; não
substitui isolamento contra um processo adversário alterando arquivos durante
a leitura.

`samples`, `sources` e `sampleCounts` preservam os dados observados e sua
proveniência. As categorias são:

- `validations`: duração da execução do harness, inclusive bloqueios.
- `reviews`: tempo entre solicitação e registro; inclui espera, sem inferir tempo
  ativo do revisor.
- `ci`: tempo da observação local, quando registrado. Não é a duração da CI.
- `checks`: duração declarada dos gates de validação, discriminada em `byStage`.
- `ciJobs`: duração `startedAt` até `completedAt` dos jobs/shards do GitHub.
- `ciRuns`: janela `createdAt` até `updatedAt` da execução CI concluída; inclui
  espera e não mede CPU. Execuções em andamento não recebem duração final.

`durationsMs` e `byStage` trazem `count`, `missing`, `samples`, `p50` e `p95` em
milissegundos. Usa-se o posto mais próximo: posição `ceil(n × percentil)` na
amostra ordenada. Uma amostra vazia produz percentis `null`; uma amostra unitária
tem p50 e p95 iguais ao único valor. Datas inválidas e tempos negativos não viram
zero. Zero só representa um valor observado válido. `passed: null` significa
desconhecido; jobs pendentes, skipped e neutral não contam como sucesso.

Observações CI repetidas usam o ID remoto para evitar contar a mesma execução
duas vezes; duplicatas constam de `ignored`. Jobs usam ID remoto ou nome dentro
da execução. A primeira observação encontrada é preservada, portanto o agregado
não é um painel de estado mais recente. Consulte o relatório de operações para
diagnóstico atual. Não há comparação causal entre equipes, períodos ou modelos.

`queue` inclui estados, pendências, tentativas, retentativas, falhas observadas,
esperas e durações. A espera inicial começa em `createdAt`; nas retentativas,
começa no fim da tentativa anterior ou no vencimento do lease sem conclusão.
Uma tentativa em andamento conserva duração `null`. Jobs com IDs repetidos não
ampliam a amostra; registros estruturalmente inválidos são contados. Jobs sem
tentativas continuam na amostra e nas pendências. O chamador determina o instante
da fotografia; coleta não adquire uma transação com a fila.

`failures` lista estados de falha/bloqueio e fontes por categoria. `rework`
registra somente retentativas da fila e pareceres `changes-requested`. Isso não
prova correção de defeito, gasto humano nem desperdício. `unavailable.cost`,
`unavailable.tokens` e `unavailable.humanTimeMs` permanecem `null`: não existem
recibos de provedor ou fonte de horas humanas nesses artefatos. FAST e preview
sem evidência preservada no local permitido não têm amostra. Sem baseline
longitudinal não há alegação de ROI ou ganho de produtividade.

## Corpus e interpretação da avaliação

O corpus versionado é
[`specs/evals/orchestrator-cases.json`](../specs/evals/orchestrator-cases.json).
O arquivo regular tem limite de 1 MiB; seus ancestrais e o arquivo não podem ser
symlinks. O schema é:

```json
{
  "schemaVersion": 1,
  "corpusVersion": "2026-11-10.1",
  "evaluationType": "contract",
  "synthetic": true,
  "cases": [
    {
      "id": "identificador-unico",
      "description": "Resultado observável esperado.",
      "validator": "validation",
      "expectedAccept": false,
      "input": { "task": {}, "started": "data ISO", "evidence": null }
    }
  ]
}
```

Existem de 1 a 1.000 casos. IDs únicos usam letras minúsculas, números e hífen,
até 100 caracteres. `expectedAccept` é booleano. Para `validator: "validation"`,
`input` fornece `task`, `started` e `evidence`. Para `validator: "review"`, fornece
`request` e `response`. Objetos de evidência/resposta podem ser inválidos
intencionalmente; a estrutura externa do corpus precisa ser válida. Campos com
comandos são dados fornecidos aos validadores e nunca são executados.

Os 17 casos atuais cobrem contratos válidos de validação e revisão, FAIL
estruturalmente válido, fonte/SHA obsoletos, evidência/checks ausentes, data antiga,
browser ausente, revisão própria, IDs divergentes e PASS contraditório com
achados ou checks. Datas fixas antigas evitam depender do relógio corrente.

`evaluateContracts` chama diretamente `validationProblem` de
`tools/orchestrator.mjs` e `responseProblem` de `tools/agent-review.mjs`. Não há
cópia das regras de aceitação. Cada caso retorna decisão esperada/real, motivo,
erro, `correct` e `falseApproval`. Uma exceção do validador falha a avaliação,
mesmo quando o caso esperava rejeição. Schema externo inválido lança erro antes
de produzir um relatório de sucesso. O relatório inclui versão e SHA-256 do
corpus efetivamente lido.

Na matriz de confusão, positivo significa **aceitação do contrato**:

| Campo           | Significado                        |
| --------------- | ---------------------------------- |
| `truePositive`  | Contrato válido aceito             |
| `falsePositive` | Contrato rotulado inválido aceito  |
| `trueNegative`  | Contrato inválido rejeitado        |
| `falseNegative` | Contrato rotulado válido rejeitado |

`falseApprovals` é `falsePositive`. Um parecer `FAIL` consistente pode ser
contrato aceito: isso não aprova o código revisado. `passed` exige todos os casos
corretos e sem erro; `status` é `passed` ou `failed`. Essa é uma avaliação de
contratos determinísticos em corpus sintético pequeno. Não avalia compreensão
semântica, capacidade geral de modelo, identidade real do revisor ou segurança
de produção. A revisão independente pelo runtime e suas evidências continuam
uma atividade separada.
