# Plano de mensuração — rapidez com rigor

O projeto ilustra um processo; **não dispõe de dados suficientes para afirmar percentuais de produtividade, autonomia, ROI ou redução de incidentes**. A proposta abaixo permite construir uma comparação justa a partir de agora.

## Instrumentação mínima por tarefa

| Campo | Definição e coleta |
| --- | --- |
| `task_id`, `spec_ref`, `commit_sha`, `pr_number` | Identidade e rastreabilidade única da mudança |
| `started_at`, `ready_for_review_at`, `merged_at`, `deployed_at` | Marcos observáveis; guardar timestamps e timezone |
| `human_active_minutes` | Tempo humano efetivamente despendido em descoberta, revisão e correção |
| `agent_invocations`, `model_id`, `agent_role` | Chamadas, papel e versão do modelo, se houver orquestração instrumentada |
| `inference_cost`, `tool_cost` | Custo medido por tarefa, moeda e fonte; não estimar sem evidência |
| `ci_duration`, `checks_total`, `checks_failed` | Logs de execução por SHA, incluindo novas tentativas |
| `rework_minutes`, `reopened`, `post_release_defects` | Retrabalho humano e defeitos com severidade definida |
| `acceptance_outcome` | Critérios de aceite cumpridos, rejeitados ou inconclusivos |
| `device_validation` | Navegador, versão, sistema, orientação, viewport e captura real |

## Indicadores derivados

- **Lead time da mudança:** horário do deploy válido menos horário do primeiro commit da mudança; declarar qual relógio e se inclui espera por revisão.
- **Frequência de deploy:** deploys efetivamente concluídos em produção por unidade de tempo, não número de PRs ou builds.
- **Taxa de falha de mudança:** deploys que causaram incidentes/rollback dividido pelos deploys, com janela de observação documentada.
- **Tempo de recuperação:** intervalo entre incidente confirmado e restauração do serviço. Se não houve incidente, reportar “não observado”, não zero.
- **Tempo de feedback:** duração entre mudança enviada e primeiro resultado confiável de testes/avaliação.
- **Eficiência de revisão:** tempo ativo gasto em revisão e correção por tarefa de complexidade equivalente.
- **Taxa de aceite de primeira passagem:** tarefas aprovadas sem correção adicional dividido pelo conjunto elegível.
- **Assertividade do agente:** entregas aceitas com critério verificável e sem falha atribuível à saída, por papel; requer classificação humana.

As [métricas DORA](https://dora.dev/) referenciam desempenho de entrega; o projeto deve evitar tratá-las como substitutas de valor entregue ao jogador.

## Experimento de comparação proposto

1. Escolher **tarefas equivalentes** em complexidade, dependências e riscos; não comparar uma mudança de texto com um boss 3D.
2. Criar baseline de pelo menos alguns ciclos antes de alegar tendência; preferir volume maior e apresentar distribuição e dispersão.
3. Comparar fluxos **com** e **sem** handoffs especializados, registrando tempo humano, tempo de execução, custo total, defeitos e retrabalho.
4. Tratar diferenças de ferramentas, cache, experiência do executor e escopo como variáveis de confusão.
5. Mostrar resultados positivos, neutros e negativos. Em amostras pequenas, apresentar estimativas e incerteza, não causalidade.
6. Exigir evidência por SHA: reportar regressões detectadas nos testes e também defeitos escapados após deploy.

## Painel executivo — campos sem valores fictícios

| KPI | Baseline | Atual | Meta | Status |
| --- | --- | --- | --- | --- |
| Lead time p50/p90 | A medir | A medir | Definir após baseline | Não instrumentado |
| Tempo até feedback CI | A medir | A medir | Definir após baseline | Logs disponíveis, agregação pendente |
| Retrabalho por tarefa | A medir | A medir | Definir após baseline | Não instrumentado |
| Taxa de falha de release | A medir | A medir | Definir após baseline | Exige classificação de incidente |
| Horas humanas por entrega válida | A medir | A medir | Definir após baseline | Não instrumentado |
| Custo total por entrega válida | A medir | A medir | Definir após baseline | Não instrumentado |

**Lição:** velocidade útil é entregar mudanças aceitas com evidência, não gerar diffs mais rapidamente.

[Estudo de caso](CASE-STUDY.md) · [Evidências](EVIDENCIAS.md).
