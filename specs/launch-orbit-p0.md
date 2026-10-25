# P0 — Ascensão Orbital: coerência de cenário e colisão

## Contratos de gameplay

- O primeiro setor dura 85 s até a aparição do chefe (era 65 s), mantendo os 10 setores e saves legados.
- Cidade, torres, solo e props próximos recuam e desaparecem antes da primeira renderização do planeta. Cidade/Terra não coexistem em nenhum quadro.
- Caças aparecem acima do solo na fase urbana. Tanques e walkers são exclusivos do trecho terrestre. Túneis industriais não são gerados durante a ascensão orbital web.
- Até a subida, obstáculos industriais pertencem à cidade; em órbita, o tráfego é formado por cargueiras abandonadas, satélites e destroços com rotas de desvio possíveis.
- Os volumes de colisão correspondem às superfícies sólidas visíveis. Tiros aliados e inimigos usam colisão swept no referencial do obstáculo em movimento; nenhum projétil atravessa vigas ou painéis finos.
- **Ocultação antes do dano:** tanto os tiros aliados quanto os hostis verificam primeiro o volume sólido móvel; disparos bloqueados não devem causar dano à nave, a inimigos ou aos chefes atrás da estrutura, mesmo que a renderização da parede seja atualizada depois do movimento do tiro.
- Pausa, reinício, troca de fase, combos, combate contra chefe e plataformas nativas preservam os comportamentos previamente contratados.

## Gates antes de merge / promoção

- Testes unitários para transição, duração, geometrias, aberturas e projéteis rápidos.
- Browser desktop e mobile: capturas na cidade, transição, horizonte terrestre e **obstáculos espaciais com encounters ligados**, além de nave x parede, projéteis x obstáculos e ausência de erros WebGL.
- Aprovação visual de usuário obrigatória, CI verde no SHA final e check de FPS/experiência. Sem publicação automática em HML/PROD.
