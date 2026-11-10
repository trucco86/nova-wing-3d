# Orquestrador persistente — operação local

O pacote [NW-14/NW-15](../specs/nw-14-maturity-pack.md) usa Node 24 e SQLite
embutido, sem novo serviço ou dependência npm. Comandos antigos de contexto,
validação e revisão continuam carregando sem importar a fila. O armazenamento
fica em `artifacts/orchestrator/queue.sqlite`, ignorado pelo Git.

## Executar um trabalho

```sh
npm run agent:orchestrate -- queue-enqueue evaluations specs/nw-14-maturity-pack.md piloto-evals
npm run agent:orchestrate -- queue-work worker-local
npm run agent:orchestrate -- queue-status
```

Tipos permitidos: `validation`, `evaluations`, `operations-audit` e `review`.
O worker seleciona um subprocesso fixo; texto da spec nunca vira comando.
`--drain` processa até 32 trabalhos disponíveis. `--watch=60` observa a fila por
até 60 segundos, também limitado a 32 trabalhos; o máximo configurável é uma hora.
Esses comandos não iniciam um bot de modelos nem executam merge/deploy.
O watch limita a espera por novos trabalhos; uma tarefa já iniciada conserva seu
próprio timeout. Interrupção por SIGKILL não garante término imediato dos filhos.

Cada `taskId` é único. Repetir o mesmo contrato retorna o trabalho original;
reutilizar o nome com outra fonte/spec ou outros limites é erro. Mudança de fonte
exige novo contrato. A fila fixa o SHA e o digest, e o worker os verifica antes e
depois da tarefa. O padrão é duas tentativas, timeout de cinco minutos e lease
com margem de trinta segundos; a API permite limites explícitos dentro dos tetos
definidos no código.

## Revisão por agente

Após uma validação gerar `runId`:

```sh
npm run agent:orchestrate -- queue-enqueue review specs/nw-14-maturity-pack.md piloto-revisao <runId> <implementerId>
npm run agent:orchestrate -- queue-work worker-local
# O runtime entrega request.json ao agente; response.json segue o contrato.
npm run agent:orchestrate -- record-review <runId> <jobId>
npm run agent:orchestrate -- queue-reconcile <jobId>
```

O `jobId` também é o ID determinístico da solicitação. Repetir o despacho não
sobrescreve uma solicitação existente. Spec, SHA, digest e identidade declarada
ficam vinculados ao run de validação. A reconciliação só aceita o parecer
registrado para a mesma spec e versão; sucesso dessa tarefa encaminha para CI.
A identidade efetiva pertence ao runtime, não é autenticada pelo texto do JSON.

## Retomada e cancelamento

SQLite mantém trabalho, tentativa e evento na mesma transação, com WAL e
sincronização FULL. Dois workers não recebem a mesma lease ativa. Se um processo
cair, a lease expira e outro worker pode retomar até o limite de tentativas. A
conclusão da lease anterior é rejeitada. Reenviar uma conclusão já aceita não
gera outro evento.

A validação Node da fila também isola logs e relatório por UUID, sem usar o lock
global legado. Assim, uma validação interrompida não bloqueia a retomada por um
arquivo `.lock` abandonado. O comando `check` direto/browser conserva seu contrato
de lock; o modo isolado é interno à fila e não executa navegador. A CI continua
usando `artifacts/validation.json` por padrão.

Timeout encerra o grupo do subprocesso, incluindo descendentes nesse grupo. SIGINT/SIGTERM do
worker também encerram o grupo e registram cancelamento, sem continuar o drain.
SIGKILL não permite limpeza imediata: tarefas locais em andamento podem terminar,
mas uma conclusão expirada não é aceita. Operações são retomáveis e podem repetir
após queda; não existe promessa de execução exatamente uma vez.

Falhas de qualidade e achados de auditoria são bloqueios, sem retry automático.
Erros operacionais podem repetir dentro do orçamento. Depois do limite, investigar
a causa e criar nova tarefa; não apagar tentativas para obter sucesso aparente.
O banco local não é uma fila distribuída, nem um backup de produção. Corrupção de
disco e autenticação multi-host exigem infraestrutura adicional.
Processos que criam sessões ou grupos próprios exigem um supervisor externo para
contenção completa; a fila não é um sandbox de segurança do sistema operacional.

## Medição, avaliação e operação

```sh
npm run agent:orchestrate -- metrics
npm run agent:orchestrate -- evals
npm run agent:orchestrate -- ops-audit
npm run agent:orchestrate -- recovery-drill
npm run agent:orchestrate -- ci-observe <githubRunId> <SHA-completo> <digest-completo>
```

Relatórios permanecem locais, com `releaseReady: false`. Consulte
[métricas e avaliações](ORCHESTRATOR-METRICS-EVALS.md) e
[auditoria e recuperação](ORCHESTRATOR-OPERATIONS.md). Corpus sintético não mede
qualidade geral do modelo. A auditoria com 403 não certifica proteção remota;
o ensaio local não certifica rollback de produção. Custos sem recibo ficam nulos.
