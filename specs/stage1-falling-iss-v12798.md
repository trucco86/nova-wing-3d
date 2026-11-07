# QA v1.27.98 — fase 1: colisão física, destroços orbitais e ISS

## Defeito reproduzido em fonte

A camada `createCityDestructionScene` desenhava placa, hovercar e sete fragmentos da fachada, mas `world.cityHazards()` recebia apenas `cityCatastrophe`, `cityReactive` e `cityLocalSolids`. Consequência: modelos aparentemente sólidos atravessavam a nave. O teste antigo verificava somente animação e contato no chão, sem comprovar colisão durante o voo.

## Correção

- Registrar cada volume real dos **modelos de caixa que efetivamente estão visíveis**, calculando AABB pela matriz mundo (incluindo rotações). Centro, três semieixos e posição anterior XYZ acompanham cada transformação.
- Os colliders só ficam ativos quando toda a hierarquia do objeto estiver visível. Fachadas estáticas, efeitos de poeira, flash e estruturas fora da rota não podem gerar colisores fantasmas.
- Atualizar a lista física no mesmo frame em que a animação roteirizada é posicionada; sem um frame de atraso. Resolução CCD da nave continua movendo-a para fora do sólido mesmo com invulnerabilidade e o projétil considera o movimento XYZ do próprio destroço.
- Placa e carro caem perto da **faixa central**, criando duas esquivas reais com ambos os flancos disponíveis; pedaços de fachada alcançam o flanco esquerdo. Proibido reinstalar o corredor invisível em ±36: voo livre existente até ±72 continua válido.
- Destruição só na cidade antes do Super Boost. Não afetar Marte, fases 3 a 10, sequência orbital aprovada ou os chefes.

## Cinemática orbital premium

- 24 peças pré-alocadas de metal, cerâmica e fragmentos angulares, com posição, tamanho, direção, profundidade e giros variados a partir do gerador de aleatoriedade do jogo. A distribuição é amostrada por missão, não repetida como um mesmo enxame sincronizado. Nível Médio usa 14 elementos.
- A ISS é uma **passagem visual rápida**, perto da borda visível da Terra, por cerca de 6,5 segundos, seguida de desaparecimento; não é um alvo, obstáculo ou elemento de colisão. O jogador não precisa desviá-la.
- Modelo com módulos cilíndricos, treliça central, radiadores, antena e oito conjuntos solares em silhueta, usando geometria compartilhada e materiais fixos. Referências de forma: NASA ISS facts (https://www.nasa.gov/reference/international-space-station/) e Integrated Truss Structure (https://www.nasa.gov/international-space-station/integrated-truss-structure/). Não implica escala física real na cena.
- A ISS surge só depois do início da revelação da Terra, jamais sobre a cidade. Reinício reabilita uma nova aparição; troca de fase desliga tudo.

## Aceite obrigatório

1. Teste Node comprova corpo físico da placa com desvio forçado em x=0,y=6,z=9, e ausência de colisão no flanco livre.
2. Teste WebGL desktop/mobile começa na fase 1 real, comprova contato, registra frames da cidade e valida desvio sem perdas no flanco livre.
3. Teste orbital comprova densidade/variedade do enxame e passagem curta da ISS, com screenshot sobre a Terra e nenhum objeto exibido em Marte.
4. Gate Node + quatro shards Playwright sobre SHA final e revisão visual/FPS em celular antes de produção. PR draft sobre QA v1.27.97, sem alteração de main.

## Refinamento de densidade (QA98)

As datas de entrada das 24 partículas são estratificadas com jitter por missão, mantendo coordenadas, materiais, escala, giros e direção aleatórios. Isso evita longos intervalos com somente um destroço visível na subida. A seleção no perfil Médio distribui as 14 peças ao longo de toda a janela, não apenas no começo.
