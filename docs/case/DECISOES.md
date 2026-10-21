# Decisões, trade-offs e o que mudaria

Estes registros explicam racional técnico observado. São notas retrospectivas do case, não ata fictícia de decisão ou de revisão por um comitê formal.

## D-01. Validar a ideia com um jogo 3D

**Hipótese:** é possível aproximar a ideia do feedback de uso real com um protótipo leve. **Benefício:** avaliação imediata de visual, movimento, controle, som e usabilidade. **Trade-off:** interatividade 3D introduz variáveis de performance, compatibilidade e subjetividade de UX.

## D-02. Fonte única em `src/`; HTML gerado

**Problema:** modificar diretamente o HTML publicado geraria deriva entre código e distribuição. **Decisão:** fonte editável em `src/`, artefato `index.html` derivado e comparado por `build:check`. **Custo:** bundle de arquivo único cresce e exige disciplina de regeneração.

## D-03. Contexto versionado em vez de depender da conversa

**Problema:** o histórico de chat não é contrato estável para uma mudança. **Decisão:** especificações, instruções de agentes e skills em Git. **Trade-off:** documentação demanda manutenção e pode ficar desatualizada; especs muito longas se aproximam de pseudocódigo e reduzem flexibilidade.

## D-04. Testar simulação real com relógio e interfaces injetados

**Problema:** regressões raras são difíceis de reproduzir manualmente. **Decisão:** harness determinístico, acompanhado de testes WebGL reais. **Trade-off:** o teste com mocks verifica regra, não qualidade gráfica, áudio real ou acessibilidade efetiva.

## D-05. Browser primeiro; nativos depois

**Problema:** velocidade de avaliação de protótipos. **Decisão:** validar web antes de incorporar mudanças aos apps. **Custo:** paridade temporária entre web, Android e iOS; deve ser explicitada em releases.

## D-06. Handoffs especializados sob responsabilidade humana

**Hipótese de evolução:** separar descoberta, requisitos, arquitetura, implementação, qualidade, revisão e delivery reduz mudanças sem contexto. **Estado:** processo de referência proposto, não execução automática comprovada. **Custo potencial:** latência extra, consumo de tokens, revisões duplicadas e conflitos entre agentes. **Experimento necessário:** medir esforço total e retrabalho contra fluxo menos especializado.

## D-07. Publicar com evidência, não com narrativa de sucesso

**Decisão:** vincular afirmações a PR, testes, build e run por SHA; reportar falhas e limitações. **Trade-off:** comunicação menos chamativa que uma alegação de produtividade extrema, porém tecnicamente defensável.

## Pendências de decisão

- Política de retenção dos artefatos de CI e baseline de velocidade.
- Telemetria de FPS e regressões de compatibilidade com consentimento e privacidade.
- Critério para adotar ferramentas de orquestração e aprovação por papéis distintos.
- Política de captura/voz e direitos sobre músicas, ilustrações e assets do vídeo.

[Voltar ao case](CASE-STUDY.md) · [Papéis](PAPEIS-E-HANDOFFS.md).
