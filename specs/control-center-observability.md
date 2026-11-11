# Nova Wing Control Center | Contrato funcional v1

## Objetivo
Oferecer acompanhamento público e responsivo do estado do projeto, sem interpretar
a dashboard como um agente que desenvolve o jogo ou modifica deploys.

## Dados, origem e semântica
- Consultar apenas endpoints públicos do repositório `trucco86/nova-wing-3d`.
- Exibir issues abertas separadas de PRs, PRs abertas e histórico de PRs integradas.
- Exibir CI da branch `main`, job Pages associado e SHA da `main` quando disponíveis.
- Exibir bloqueios apenas de issues abertas com prefixo `[monitor]`.
- Não inventar sucesso de deploy: ausência de job ou execução deve aparecer como "Sem dados".
- As listas de issues, PRs e execuções são recortes da primeira página consultada;
  não representar seus totais como inventário exaustivo enquanto não houver paginação.

## Interação e acessibilidade
- Português do Brasil, layout legível em 390px e desktop, navegação por teclado,
  indicadores de atualização e erro acessíveis.
- Abas Tarefas, PRs e Bloqueios filtram dados já carregados sem novas consultas.
- Atualização manual disponível; automática em 30 ou 60 minutos ou desativada.
- Nunca usar credenciais no navegador; todos os textos retornados pelo GitHub
  devem ser inseridos via textContent e links HTTPS.

## Controle da API e falhas
- A opção padrão de 30 minutos demanda cerca de 14 requisições/hora por aba
  quando a consulta ao job CI é necessária, abaixo das 60/h públicas por IP
  em uso isolado. Abas e usuários no mesmo IP compartilham esse orçamento.
- Quando o header X-RateLimit-Remaining for inferior a oito, respeitar
  X-RateLimit-Reset antes de fazer uma nova consulta; 403 e 429 também ativam
  esse limite quando o servidor informar o instante de recuperação.
- Se um endpoint falhar, mostrar aviso explícito, preservar os dados anteriores
  e permitir nova tentativa quando o limite liberar.
- Não fazer polling automático de um minuto: sete endpoints a cada minuto
  esgotam o limite público no cenário normal.

## Critérios de aceite
1. Respostas GitHub simuladas preenchem tarefas, PRs, CI, Pages e entregas.
2. As três abas filtram issues/PRs em memória; bloqueios ficam separados.
3. Erro da API preserva os indicadores anteriores e mostra alerta.
4. O seletor alterna cadências 30/60 minutos e manual, sem múltiplos timers.
5. Headers do limite suspendem novas consultas até o reset informado.
6. CI Node, testes comportamentais reais, build do repositório e verificação
   browser são aprovados antes de merge; Pages deve ser verificado após deploy.

## Limitações
Este painel não executa desenvolvimento, não automatiza aprovação de PRs e
não substitui GitHub Actions nem homologação de gameplay. O monitor de 30 minutos
é uma dependência separada, proposta na PR #315, que deve passar por revisão.
