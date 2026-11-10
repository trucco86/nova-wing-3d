# NW-14/NW-15 — Pilotos, medição, avaliações e operação persistente

Status: implementação em branch isolada; sem merge, preview ou publicação.

## Objetivo e responsabilidades

Executar as cinco prioridades de maturidade com evidências reais: operacionalizar
o fluxo em tarefas pequenas, coletar métricas, avaliar contratos de agentes,
automatizar despachos com estado durável e exercitar controles de operação.
O mantenedor controla escopo e publicação; o runtime chama agentes; o harness
coordena trabalhos locais e observa CI. Nenhuma saída autoriza produção.

## Contratos

### Fila local persistente

- SQLite do Node 24 em `artifacts/orchestrator/queue.sqlite`, com transações,
  WAL e sincronização FULL. Um `taskId` único fornece idempotência ao enfileirar.
- Trabalhos fixos `validation`, `evaluations`, `operations-audit` e `review`.
  Não executar comandos vindos de specs, pareceres ou campos arbitrários.
- Cada trabalho fixa spec, SHA e digest, registra limites, tentativas, eventos,
  trabalhador e token de lease. Expiração permite retomada limitada; conclusões
  com token antigo são rejeitadas. Falhas de comportamento não são repetidas
  automaticamente. Histórico incompleto, fonte alterada e evidência divergente
  bloqueiam o trabalho.
- `queue-enqueue <kind> <spec> <taskId>`, `queue-work <workerId>` e
  `queue-status [jobId]` expõem a fila pela CLI. O worker executa apenas a lista
  fixa, com limites de tempo e tentativas; a revisão produz solicitação persistida
  para o runtime, sem bot de modelos residente.
- `listJobs({root})` retorna trabalhos com `id`, `taskId`, `kind`, `spec`,
  `commit`, `sourceDigest`, `status`, `createdAt`, `updatedAt`, `limits`,
  `attempts` e `events`. Cada tentativa registra trabalhador, lease, início,
  vencimento e, ao terminar, fim, resultado e motivo. Datas são ISO UTC.
- Sem promessa de execução exatamente uma vez: a execução é retomável e pode ser
  repetida após queda. Uma conclusão aceita é idempotente; operações externas de
  publicação nunca são despachadas. O armazenamento é local, não uma fila distribuída.
- A validação Node da fila usa um diretório de evidências exclusivo por run, por
  `NOVA_VALIDATION_DIR`, validado dentro de `artifacts/`. Não depende do lock ou
  relatório compartilhados do comando legado. A saída padrão da CI permanece
  `artifacts/validation.json`; browser mantém seu gate dedicado. Escritas de
  evidência são atômicas e recusam redirecionamento por symlink.

### Medição — NW-15

- Agregar validações, revisões, CI e trabalhos da fila; preservar amostra,
  proveniência, falhas, esperas, tentativas e durações p50/p95.
- `collectMetrics({root,jobs})` retorna e preserva um relatório local. Custos,
  tokens e tempo humano sem fonte observável ficam `null`, nunca zero presumido.
  Dados iniciais não justificam ROI nem causalidade de produtividade.

### Avaliações

- Corpus versionado de decisões corretas/incorretas, fontes obsoletas, revisão
  própria, evidência incompleta e PASS contraditório, usando os validadores reais.
- `evaluateContracts({root})` retorna matriz de confusão, aprovações indevidas,
  resultados por caso e aprovação geral; fixture sintética é identificada.
- Exercício adicional de revisão por agente no runtime com rubrica e evidência;
  não confundir acerto de contrato determinístico com qualidade geral do modelo.

### Operação e recuperação — NW-11/NW-18

- `auditOperations({root,repository})`: observar configuração local e proteções
  remotas de `main` somente por leitura, indicando desconhecido/bloqueado quando
  a API não fornecer evidência. Não alterar regras nem permissões.
- `observeCI({root,githubRunId,expectedCommit,expectedDigest,repository})`: vincular
  CI ao SHA esperado, exigir quality + quatro shards + browser, e preservar fatos.
- `recoveryDrill({root})`: ensaio em worktree temporária isolada da versão atual,
  falha deliberada, detecção, restauração e verificação da recuperação; sem deploy.
  Não alegar rollback de produção a partir desse ensaio local.

## Aceite e evidências

1. Testes cobrem concorrência, restart, expiração/fencing, limites, idempotência,
   mudança de fonte, rejeição de caminhos e transições inválidas.
2. Executar pilotos reais de validação, avaliações, auditoria e revisão; simular
   interrupção e retomar sem aceitar conclusão antiga nem duplicar a conclusão.
3. Publicar relatório local de métricas e de avaliação com amostra e limitações.
4. Registrar auditoria de regras remotas e resultado do ensaio de recuperação.
5. FAST como feedback, FULL local, revisão independente e quatro shards da CI no
   SHA final. Preservar jogo, bundle, lockfile e workflows da base integrada.

## Limites

Não completar integração em main nem adoção organizacional por inferência. Não
autenticar identidade de modelo por um texto no JSON. Acesso a recibos do provedor,
baseline longitudinal e homologação operacional em produção continuam dependências
externas; executar o que for observável e declarar os dados ausentes.
