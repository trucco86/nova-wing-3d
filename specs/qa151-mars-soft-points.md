# QA151 | Corrigir sprites quadrados de poeira no navegador

## Evidência

Os screenshots da fase 2, no mesmo quadro e viewport de 390x844, dos
workflows 43760246846 (QA148) e 43766472931 (QA150) são praticamente
idênticos. A tempestade ainda tem dezenas de quadrados luminosos.
O simples patch `PointsMaterial.onBeforeCompile` da QA150 não demonstrou
qualquer efeito visual, apesar da CI completamente verde.

## Correção

- Substituir o patch não verificável por um mapa RGBA radial de 32x32 gerado
  uma única vez com `DataTexture`, compartilhado entre instâncias.
- Usar o mapeamento nativo de `PointsMaterial.map`; transparência central
  e queda suave até alfa zero nas bordas. Não há novas malhas, draw calls,
  novos pontos, física, vento nem atualização de textura por frame.
- Custo de memória da origem: 4096 bytes RGBA, mais overhead de GPU e objeto.
  O compromisso de zero texturas da QA150 é revisto porque aquela solução
  não resolveu a imagem. A nova textura é intencional, pequena e compartilhada.
- Diminuir o tamanho dos pontos de 5 para 4.1 para reduzir oclusão da mira.

## Gate visual obrigatório

Capturar novamente o mesmo frame `mars-07-midstage-sandstorm-crosswind.png`
com o Playwright. Comparar lado a lado com QA150 antes de considerar o defeito
corrigido. Os testes Node agora inspecionam o verdadeiro conteúdo do alpha map.
Verificar ainda Shader/WebGL, iPhone real, draw calls, FPS/p95 e pausa tática.
A CI verde sozinha nunca homologa a qualidade visual.
