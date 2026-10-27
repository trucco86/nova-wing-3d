# P0 — Isolamento de consentimento e apelido entre contas Google (#110)

## Risco

Na candidata #107, o formulário de participação e o nickname eram compartilhados
pelo navegador mesmo quando o Firebase mudava de A para visitante ou B.
Um upload de pontuação iniciado antes da troca poderia obter token depois da
troca e prosseguir sem consentimento da identidade atual. A UI ainda podia
exibir linhas do histórico privado da conta anterior enquanto aguardava API.

## Contratos de aceite

- Apelido e checkbox de ranking começam **sempre vazios/desmarcados**, mesmo
  após navegador restaurar formulário automaticamente.
- A cada troca de objeto de sessão Google (incluindo logout), limpar campos,
  invalidar a run e ocultar imediatamente histórico remoto antigo.
- Apenas novo opt-in explícito pode enviar runs da nova sessão; modo visitante,
  cancelamento e erros de rede continuam registrando os resultados **locais**.
- Se opt-in for desmarcado durante a fase, invalidar a run remota, não enviar
  finish; marcar novamente no meio da fase não restaura a run.
- Checar geração de sessão **após** `getIdToken()`: token antigo assíncrono
  não pode iniciar nem concluir um envio de outra conta.
- Depois de fetch de finish já transmitido, não associar resposta tardia ao
  usuário atual nem alegar sucesso para outra conta.
- Não permitir que cancelamento da UI exclua histórico local ou checkpoint.
- Preservar a separação dos rankings experimentais (`verified:false`) e
  oficiais (resultados com prova autoritativa).

## Evidências exigidas

- `tests/ranking-account-consent.test.mjs`: troca A→visitante→B,
  revogação antes do finish, resolução tardia de JWT, erro da API, histórico
  local e limpeza síncrona de conteúdo privado.
- `npm run validate` e testes de navegador da CI no **commit final**.
- Homologação humana com Firebase real e dispositivos separados ainda
  obrigatória antes de HML com gravação ou qualquer deployment PROD.
- Worker pode reter perfil criado na abertura de uma run abandonada;
  UX de exclusão e política de retenção continuam pendências LGPD.
