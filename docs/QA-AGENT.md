# Agente revisor de testes — contrato operacional

**Papel:** revisor independente de qualidade, acionado em cada nova PR ou interação que altere código, comportamento, UX ou testes. A skill canônica é [nova-wing-qa](../skills/nova-wing-qa/SKILL.md).

## Checklist por interação

1. Mapear arquivos alterados e riscos por componente.
2. Conferir spec e testes de regressão; solicitar cenários ausentes.
3. Validar padrões de teste, formatação, lint, build e consistência de versões.
4. Em UI/gameplay, exigir evidência Playwright e checagem mobile; em áudio, exigir gesto de desbloqueio e teste perceptivo.
5. Ler os logs de falha; corrigir **a causa**, não ocultar o erro.
6. Publicar parecer **PASS / FAIL / BLOCKED**, com SHA, comandos, evidência, riscos e pendências.
7. Somente recomendar merge após checks requeridos verdes no último SHA; teste físico não executado continua pendente.

## Limites de automação

Este documento define o comportamento do agente para cada execução de trabalho. Não cria sozinho um bot residente, webhook nem um revisor automático do GitHub. A CI existente continua sendo o mecanismo automático a cada PR. Automação independente de comentários em PR exige um workflow/app com permissões próprias e testes prévios.

## SonarQube

Sonar analisa qualidade estática e riscos; não substitui Playwright, harness, revisão visual nem testes físicos. Rodar em **job paralelo**, com cache do scanner, permissões mínimas e segredo `SONAR_TOKEN` protegido. Não exigir Quality Gate enquanto a organização/projeto não estiverem conectados e uma execução real não tiver sido validada.
