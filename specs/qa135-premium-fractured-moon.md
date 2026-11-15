# QA135 | Lua rachada premium e orçamento de renderização

## Problema

A Lua rachada na Cidade Premium aparecia como uma esfera lisa com poucas linhas luminosas. A Lua do trecho orbital usava outro shader, interrompendo a continuidade visual. O cenário também precisa preservar a fluidez, particularmente em mobile e na subida ao espaço.

## Comportamento esperado

1. A Lua da Cidade permanece atrás de prédios, letreiros e horizonte, sem colisor e sem atravessar a arquitetura.
2. A superfície exibe regiões escuras de basalto, terreno irregular, crateras com bordas e depressões, uma falha principal sinuosa, três ramificações e bordas com sombreado e emissão âmbar discreta.
3. A Lua vista na subida orbital usa o mesmo fragment shader de superfície, mas preserva o fade/ciclo de visibilidade próprios do estágio.
4. Os outros setores não herdam rachaduras que não pertençam à identidade do planeta. A configuração de mundo de gelo mantém seu tom azul.
5. Nenhuma malha extra, textura externa, bloom, particulado ou pós-processamento é criado para as fraturas. O shader usa apenas uma amostragem de fbm de cinco oitavas e duas amostragens diretas de noise por fragmento, substituindo as três camadas de fbm do shader antigo do cenário.
6. Pausa, reset, troca de setor, visibilidade da cidade e progressão da missão não mudam.

## Escopo técnico

- `src/lunar-surface.js`: shader comum de relevo lunar e fissuras, sem cálculos ou alocação por frame no JavaScript.
- `src/visuals.js`: Lua rachada distante da cidade usa shader comum, sem mudança de geometria/posição.
- `src/launch-celestials.js`: Lua orbital segue mesma linguagem visual e mantém sua animação de revelação.
- `tests/moon-premium.test.mjs`: identidade do shader, custo estático de ruído, ciclo de fade e resets de setor.

## Critérios de aceitação

- Unitários, lint, formatação, build reproduzível e quatro shards de Playwright verdes no SHA final.
- Capturas reais em 1366×768, 390×844 e 844×390; comparar crateras, contraste das fraturas, oclusão por prédios e continuidade durante ascensão.
- Perfil Alto e Médio: medir FPS p50, p95/p99 frame time, draw calls, triangulação e uso de memória no mesmo aparelho e trajeto da candidata QA134. Meta: sem regressão relevante; nenhum ganho é declarado sem medições.
- Sem merge ou deploy antes da aprovação explícita e da homologação visual.
