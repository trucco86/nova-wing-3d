# Gameplay Quality Agent

Pré-homologação observacional. A aprovação da experiência final e a autorização de produção continuam humanas.

## Conhecimento e memória

- Use [guia de gameplay](GAMEPLAY-GUIDE.md), [guidelines planetárias](PLANET-REALISM-GUIDELINES.md), specs atuais e as skills de física, dinâmica, gráficos e QA. O guia histórico não prevalece sobre specs vigentes.
- Registre cada regressão reproduzível como contrato e teste, com fase, versão, entrada, esperado, observado e evidência. Não altere referências aprovadas sem autorização.
- Priorize cidade (colisões e voo livre), Marte (continuidade da descida), Reator (órbita e acesso), Europa (túnel, movimento e ataques). Amplie depois aos dez setores.
- Julgamentos sobre diversão, estética, ritmo e sensação de movimento exigem revisão humana ou avaliação multimodal calibrada. Uma captura não prova ausência de defeitos visuais.

## Fluxo inicial

1. Desenvolvimento: execute `npm run test:browser -- gameplay-quality-observer.spec.mjs` ou selecione o cenário afetado com `--grep`.
2. PR: a suíte Playwright existente inclui os cenários automaticamente, nos projetos desktop e mobile. O relatório observacional é anexado ao teste e aos artefatos de navegador; não substitui nenhum teste obrigatório.
3. Homologação: revisar relatórios e capturas no SHA candidato; corrigir achados confirmados, reexecutar e entregar ao jogador humano os pontos subjetivos e pendências.
4. Produção: autorização explícita e gates atuais permanecem obrigatórios. O relatório não concede autorização de merge ou deploy.

## Contrato do relatório

- `OBSERVED_OK`: apenas os critérios amostrados passaram.
- `FINDINGS`: suspeitas objetivas para triagem, com valores observados e esperados.
- `BLOCKED`: erro do executor, cenário incompleto ou evidência ausente; nunca equivale a aprovação.
- Toda execução registra commit CI (quando disponível), cenário, projeto, viewport, comandos e checkpoints; a homologação humana fica pendente.
- Erros do executor falham o teste após anexar diagnóstico. Achados observacionais não alteram os gates de regressão existentes.
- Sem alteração de ranking, produção ou permissões. Fixtures de QA e tempo determinístico não representam uma campanha humana integral nem FPS de aparelho físico.

## Próximas etapas

Adicionar perfis iniciante, agressivo e adversarial; coleta contínua, replay e vídeo, verificação de colisão por telemetria, comparação com baseline aprovada, agregação no Control Center e notificação deduplicada. Depois de medir falsos positivos, avaliar gate objetivo obrigatório. Não afirmar que essas capacidades já estão implementadas.

## Observabilidade recorrente (candidata, requer merge)

- O workflow `.github/workflows/gameplay-observer.yml` permite execução manual e agenda uma rodada nos dias úteis, às 12:00 UTC (09:00 Brasília). **Não estará ativo na agenda enquanto esta PR estiver em draft.** A agenda opera na branch padrão após merge, não sobre o site publicado em produção.
- O Playwright observa o motor WebGL real em quatro cenários com fixture de QA, nos projetos desktop e mobile. É uma amostra determinística, não uma campanha completa, nem um agente multimodal autônomo.
- Cada observação gera `artifacts/gameplay-observer/<cenário>-<dispositivo>.json` e capturas anexas; o consolidado exige oito relatórios, registrando `OBSERVED_OK`, `FINDINGS` ou `BLOCKED`.
- O resultado é **consultivo**, não aprova merge, qualidade subjetiva ou publicação. Relatórios ausentes ou execução incompleta são `BLOCKED` e fazem o workflow falhar. Achados de regra objetiva ficam disponíveis para triagem.
- Apenas na execução agendada, `FINDINGS` ou `BLOCKED` podem criar ou atualizar um issue `[Gameplay Observer] Divergências para triagem`. A assinatura dos achados evita notificações repetidas para o mesmo conjunto. O issue não é fechado automaticamente, e não há mudanças automáticas no código.
- A rotina não integra ainda visualização no Control Center, vídeo contínuo, julgamentos multimodais de ritmo/estética ou telemetria de FPS e colisão em aparelho físico. Esses recursos requerem baselines, critérios de aceitação e validação específica.

### Critérios de promoção

1. Quality e seis shards browser aprovados no SHA final.
2. Relatórios dos oito cenários completos e capturas inspecionadas.
3. Conferir manualmente falsos positivos, interação real e a abertura/fase 4 afetadas por PRs paralelos.
4. Aprovação explícita do mantenedor para merge. Nada dispara deploy de produção a partir do workflow de observabilidade.
