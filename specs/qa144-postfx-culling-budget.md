# QA144: compositor e culling em High

## Diagnóstico

QA143 reduziu supersampling redundante, mas a cena em desktop High
continuava renderizando a textura offscreen 4x multisample e blurs
intermediários em `dimensão física / 3`, aumentando bandwidth.

## Mudanças

1. MSAA mantém 4 samples em telas com menos de 1M pixels CSS, usa
   2 samples em telas maiores. Somente a quantidade de amostras de
   cobertura muda, nunca o nível de detalhes geométricos/material.
2. Mantém três passes pós-processo e os mesmos fragment shaders;
   limita a resolução interna do bloom (300k texels) com aspect ratio
   preservado. Nenhum efeito é desligado.
3. Lotes estáticos de chão, vitrines, árvores, letreiros, bancos e
   móveis só são enviados ao renderer se a esfera do batch estiver
   no frustum. Pedestres e vapor permanecem sem culling para evitar
   descartar animações durante o voo.
4. Vapor High não atualiza instâncias em Medium; ao voltar para High
   invalida o intervalo de animação e recompõe os transformados.
5. Referências do cenário de rua cacheadas em WeakMap, independentes
   nos tiles próximos e distantes; cores das faixas sinalizadoras
   são reutilizadas.

## Critérios de aceite

- Testes de compositor, bounding spheres, clone, qualidade e pausa.
- Preservar conteúdo original da cidade e das fases.
- Bench comparativo no dispositivo real: p95/p99 frame, draw calls,
  GPU/JS contadores, pixels e custo do bloom.
- Aprovação visual para aliasing 2x em 1080p e integridade de
  neon/bloom nas bordas e estrelas.
- Falhas browser herdadas de QA141–143 devem ser investigadas.

Sem merge nem publicação em produção sem aprovação.
