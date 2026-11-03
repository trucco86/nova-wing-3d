# Diretriz permanente — Planetas fiéis à astronomia (Nova Wing 3D)

Referência visual: imagens em cor natural de agências espaciais, com legenda indicando filtro/iluminação; NÃO confundir cores falsas de infravermelho/ultravioleta com as cores vistas pelo olho humano.

## Fontes primárias

- Saturno: NASA Cassini natural color: https://science.nasa.gov/photojournal/saturn-in-color/
- Anéis e divisão de Cassini: https://science.nasa.gov/resource/colorful-division/
- Referência de planetas: https://science.nasa.gov/solar-system/planets/

## Regras de implementação

1. Referência NASA/JPL e condições de iluminação explícitas na spec, antes de editar shader/material.
2. Eixos de rotação, plano equatorial, topologia e sombra devem ser geometricamente coerentes; um planeta gigante com anéis não pode ser um aro arbitrário na frente do HUD.
3. Preservar perfis Alto/Médio, cenas anteriores aprovadas, desenho de área segura de voo e fase 4.
4. Não alegar cores exatas: matizes procedurais são aproximação visual, validadas comparativamente por screenshot.
5. Melhorar individualmente Júpiter, Vênus, Europa, Netuno e Titã a partir de fotos verificadas; esta PR muda somente Saturno. Terra não regredir.
6. No mobile, respeitar enquadramento portrait e o centro de mira.
7. A aceitação visual deve avaliar abertura, fase média, boss, oclusão frente/trás e p95 real em celular.
