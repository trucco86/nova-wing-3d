# Operações observáveis do orquestrador

O módulo `tools/orchestrator-ops.mjs` observa proteções e CI por leitura e exercita
recuperação local. Nenhuma função faz merge, publica, dispara workflow ou altera
regras, permissões ou a branch original. `releaseReady` é sempre `false`.

## API e relatórios

```js
import { auditOperations, observeCI, recoveryDrill } from '../tools/orchestrator-ops.mjs';

const audit = auditOperations({ root, repository: 'trucco86/nova-wing-3d' });
const ci = observeCI({
  root,
  repository: 'trucco86/nova-wing-3d',
  githubRunId: '123456789',
  expectedCommit: 'sha completo de 40 caracteres hexadecimais',
  expectedDigest: 'digest da fonte de 64 caracteres hexadecimais',
});
const recovery = recoveryDrill({ root });
```

`root` deve ser a raiz real de um repositório Git, sem componentes simbólicos.
Os relatórios ficam em `artifacts/orchestrator/operations/<UUID>/`; a função exige
que esse caminho esteja ignorado pelo Git e rejeita links em seus componentes.
Cada chamada preserva seu próprio JSON, sem sobrescrever observações anteriores.
Os campos comuns são `kind`, `runId`, `commit`, `sourceDigest`, `started`,
`finished`, `durationMs`, `passed`, `status`, `reasons`, `limitations`, `directory`
e `reportPath`. O SHA/digest comum identifica a fonte local no início; em CI,
`expectedCommit`/`expectedDigest` identificam separadamente a fonte remota esperada.
Relatórios locais são evidência não assinada, não autorização.

As duas funções remotas aceitam `execute(command, args, settings)` para testes;
o padrão é `spawnSync`. Somente chamadas `gh` passam por essa injeção. Argumentos
são arrays, sem shell; as operações remotas são exclusivamente `gh api --method
GET` e `gh run view`. Cada subprocesso tem limite de 30 segundos e resposta de
16 MiB. A API não aceita comandos arbitrários. Erros de acesso preservam categoria
e código HTTP quando disponível; stderr bruto e credenciais não são persistidos.

## Auditoria de main

`auditOperations` retorna `operations-audit.json` com `status: observed` e
`passed: true` somente quando comprova uma proteção completa, pela regra clássica
ou pelas regras efetivas de rulesets. Exige os checks `quality` e `browser`, PR,
aplicação a administradores e ausência de atores autorizados a bypass. Verifica
`branches/main/protection`, `rules/branches/main` e os detalhes dos rulesets
efetivos, no máximo 20. Rulesets em modo evaluate/disabled não comprovam proteção.
Uma proteção independente completa é suficiente; não se presume proteção de um
endpoint indisponível. Respostas ausentes, 403/404 ou incompletas ficam
`remote.*.state: unknown`; sem proteção comprovada, o resultado fica `blocked`.

`remote` preserva os fatos retornados e `checks` a interpretação de cada mecanismo.
`local` registra presença e hash de AGENTS, workflow CI e CLI; existência local
não comprova configuração remota. A auditoria não corrige regras e representa
somente o instante observado.

## Observação de CI

`observeCI` exige um ID numérico positivo seguro, SHA completo e digest completo.
Preserva a resposta de `gh run view` em `github-run.json` e o parecer em
`ci-observation.json`. Exige identidade do run e SHA exatos, conclusão success e
um job concluído com success para cada nome: `quality`, `browser`,
`browser-shard (1)`, `browser-shard (2)`, `browser-shard (3)` e `browser-shard (4)`.
Jobs ausentes, duplicados, skipped ou failed bloqueiam mesmo se o agregador browser
estiver verde. Não infere shards a partir de um agregador ou de outro run.

O digest vem de `validation.json` no artefato remoto `quality-evidence` do mesmo
run. A consulta limita a lista a 100 artefatos e bloqueia ausência, expiração,
duplicação ou excesso. O ZIP tem até 16 MiB, até 4096 entradas e o JSON até
256 KiB. O leitor suporta ZIP convencional com armazenamento/deflate; não extrai
arquivos e rejeita caminhos absolutos, traversal, symlink de evidência e evidência
duplicada. ZIP64, arquivos encriptados de evidência e formatos não suportados não
comprovam o digest. O relatório preserva ID e hash do ZIP e a validação lida.

O validador real do orquestrador exige `passed`, SHA/digest esperados, todos os
cinco gates locais e horários coerentes desde o início do run. Ausência de
artefato ou permissão de leitura deixa o resultado `blocked`, nunca certificação
por inferência. Uma execução ainda em andamento fica `pending`; somente todos os
fatos coerentes permitem `ci-passed`. Nenhum estado certifica homologação humana.

## Ensaio de recuperação

`recoveryDrill` cria uma worktree temporária detached no HEAD atual, verifica
`node --check` do CLI versionado, acrescenta uma falha de sintaxe somente nessa
cópia e exige sua detecção. Depois executa `git restore --source <SHA> --worktree
-- tools/orchestrator-cli.mjs` na cópia. Exige novamente sintaxe válida, hash
idêntico ao inicial e worktree limpa. Remove apenas a worktree criada e seu
diretório temporário; falha de limpeza mantém `blocked` e registra o caminho.

O relatório `recovery-drill.json` preserva hashes, códigos de saída, status da
cópia e integridade do HEAD/hash/status do CLI original. Alterações locais não
commitadas não são copiadas; seu conteúdo original deve sobreviver ao ensaio.
Outros arquivos do checkout original podem ser editados por trabalho concorrente;
essa observação não afirma uma comparação integral de toda a árvore original.
Resultado `recovered` comprova este ensaio local de sintaxe/restauração. Não
comprova rollback de produção, disponibilidade de hospedagem ou recuperação de
dados. Worktree isola arquivos de trabalho e não é uma sandbox de segurança.

## Verificação direcionada

```sh
node --test tests/orchestrator-ops.test.mjs
npx prettier --check tools/orchestrator-ops.mjs tests/orchestrator-ops.test.mjs docs/ORCHESTRATOR-OPERATIONS.md
```

Os testes usam repositórios temporários e executor GitHub fake, com cenários de
proteção incompleta, acesso negado, SHA/digest divergentes, shards insuficientes,
artefatos inválidos e limites de paths/IDs. O ensaio de recuperação dos testes
executa Git e `node --check` reais, preservando uma alteração não commitada no
checkout original da fixture. Esses testes não substituem observação real do
GitHub nem FULL no SHA final.
