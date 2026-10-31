# City 3.2 — Living Metropolis · integração e homologação

## Escopo do feedback do jogador

A primeira fase deve ser mais clara, colorida e povoada, com letreiros neon, publicidade fake e holofotes de busca por aeronaves; o maglev precisa ser claramente visível ao jogar no celular. Não bloquear a visão central do gameplay e não reduzir a qualidade das fases seguintes.

## Alterações integradas na candidata de QA

- #203 / #204 / #205: 12 campanhas ficcionais, letreiros em 18 fachadas reais por tile, distribuídos pelo **percurso inteiro**, com vitrines e molduras neon instanciadas. Paleta azul/ciano/roxo/rosa/verde/âmbar em Alto/Médio.
- #206: holofotes varrendo o céu com base física, animação determinística e versão simplificada Medium, sem SpotLight com sombras.
- #207: tráfego adicional de 18 veículos civis ao fundo em High e nove em Medium, luzes emissivas e rotas com alturas e velocidades variadas.
- #208: sinais pulsantes dos anúncios legados e animação dos hologramas/holofotes com distância simulada, congelando quando pausa.
- #209: painel fake na lateral interna de cada maglev, terminal comercial no começo da fase e trem transversal **acima do jogador**, a partir da câmera chase; preservar trem e linhas laterais originais.
- #210: distritos corporativo, entretenimento e transporte com faixas, vitrines e anúncios próprios.
- #211 / #212: hologramas comerciais e skyline colorido de três camadas, sem mudança na transição orbital.
- #213: Node verifica quantidades, anexação de letreiros, animação determinística, custo de instâncias, rotas de trem e isolamento por setor; Playwright captura três momentos iniciais em desktop/mobile e guarda contagem real de draw calls/triângulos.

## QA obrigatório e evidência

1. `npm run build:check`, `npm run lint`, `npm test`, `npm run check:repo`.
2. CI quality e **4/4 browser-shards** no SHA final; screenshots de primeira visão, maglev em passagem e distrito com letreiros.
3. Comparar o visual com a base City 3.1 (PR #202), priorizando visibilidade do trem e legibilidade da cidade no iPhone 390×844 portrait, landscape e desktop.
4. FPS e frame time p95 **em aparelhos físicos** Alto/Médio, comparados à base: alvo inicial regressão de até 10%. O teste de navegador registra dados de GPU do **software renderer**, que **não** comprovam esse item.
5. Validar que nenhum carro/holofote/intervenção cenográfica tenha física ou hitbox, não cubra gameplay/HUD e não vaze para oceano/órbita.
6. Verificar shop pós-fase, retorno da loja e controles antes de promover o stack #199 → #200 → #202 → #214.

**Critério de conclusão:** código em branch ≠ CI completo ≠ homologação humana. Não promover DEV/HML/PROD até aceitação visual e gates. O preview desta PR é uma candidata de QA, não uma release aprovada.
