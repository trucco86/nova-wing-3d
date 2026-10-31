# City 3.1 — Electric twilight (P0 visual QA)

## Origem
Feedback do gameplay de iPhone: a cidade de City 3.9 permanece muito escura, com prédios opacos, pouca cor perceptível e chão semelhante a um corredor negro. O problema não é apenas falta de neon, mas o conjunto de céu noturno quase preto, fog noturno denso, piso com valores de luminância baixos, metal que não recebe bounce light e vinheta forte.

## Solução implementada (candidata não homologada)
- Tratamento de **céu urbano** separado da noite orbital: tons azul/rosa e horizonte elétrico; vai desaparecendo gradualmente durante a ascensão.
- **Fog** da metrópole menos denso e azul-claro, sem comprometer o resto da campanha.
- Luz hemisférica, key/rim e luz de preenchimento magenta direcionais reajustadas **apenas na cidade** para leitura de material metálico.
- **Piso**: maior luminância do material base, juntas ciano e reflexos estilizados nas bordas; placas de rua passam de negro para azul-aço.
- **Arquitetura**: silhuetas e skyline mais claras; fachadas comerciais e shopping centers com vidro/metal visíveis.
- **Trilhos e ruas** com ciano, âmbar, rosa e mais variedade via instanceColor nos mesmos draw calls em Alto/Médio.
- Vinheta da missão urbana suavizada via classe de estado `city-bright`, sem filter CSS global e sem alterar HUD.
- Sem novas texturas externas, sombras caras, passes de postprocess, hitboxes ou draw calls por lâmpada.

## Evidências e gates
- Node verifica névoa, shader urbano, luz hemisférica, materiais, LEDs instanciados, transição orbital e isolamento do setor oceânico.
- Playwright produz captura 390×844 para revisão manual; pixels não são medidos por teste perceptual automatizado.
- Compare lado a lado primeira fase no iPhone/Android e desktop, perfil Alto/Médio, qualidade da cor, legibilidade do horizonte, brilho da NOVA-7 e FPS/triângulos.
- Fazer revisão humana da direção de arte antes de promover v1.27.48. Não mesclar ou publicar a candidata só com testes verdes.
