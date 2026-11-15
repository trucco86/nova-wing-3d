# Nova Wing | Monitor de release a cada 30 minutos

## Propósito

Detectar mudanças que exigem intervenção no pipeline de release e notificar
pelo mecanismo de issues do GitHub, sem prometer entrega contínua de código
ou notificações instantâneas do ChatGPT.

## Contratos

- O workflow agendado roda a cada 30 minutos (best effort) na branch padrão,
  e também admite execução manual.
- Localizar a CI pelo workflow `ci.yml` e pelo SHA atual da `main`,
  sem confundir execuções do próprio monitor com o último pipeline do jogo.
- Observar a conclusão da CI, o job `pages` e o HTTP do jogo em produção.
- Separar estados pendentes de falhas: CI ou Pages ainda executando não
  significam recuperação nem release concluída.
- Abrir ou atualizar uma única issue `[monitor] Nova Wing: bloqueio de release`
  quando houver falha ou execução travada acima de 90 minutos.
- Usar uma identidade de incidente estável, sem a duração variável no
  fingerprint, para evitar menções duplicadas em verificações sucessivas.
- Localizar issues de monitor por pesquisa direcionada de título,
  incluindo issues fechadas, sem depender das 100 issues mais recentes.
- Encerrar um bloqueio somente depois de CI concluída com sucesso, Pages
  concluído com sucesso e produção HTTP saudável.
- Notificar uma conclusão de release no máximo uma vez por SHA de `main`.

## Critérios de aceite

1. Cinquenta execuções recentes do monitor não ocultam a CI da `main`.
2. Uma CI pendente com Pages em fila não fecha issue de bloqueio anterior.
3. Uma CI travada por 90 e por 120 minutos preserva o mesmo fingerprint.
4. Uma issue mais antiga, ausente do primeiro conjunto de 100 itens,
   é encontrada por título e atualizada em vez de duplicada.
5. Uma recuperação real fecha exatamente a issue aberta e registra evidências.
6. Estado saudável sem mudança não cria novas notificações.
7. Testes de lógica com API simulada e validação completa da CI passam
   antes de ativar o monitor na branch padrão.

## Limites

O monitor não inicia, aprova ou promove releases. A disponibilidade HTTP
não prova por si só a versão publicada; a evidência de deploy permanece
no job Pages associado ao SHA. GitHub Actions pode atrasar a execução
agendada. Os alertas são notificações do GitHub, não mensagens garantidas
no aplicativo ChatGPT.
