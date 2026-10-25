# Direção visual — Nova Wing Mecha / Starfighter

**Status:** conceito aprovado pelo mantenedor na conversa de 24/10/2026; **implementação visual 3D pendente**. A PR [#54](https://github.com/trucco86/nova-wing-3d/pull/54) é apenas um protótipo testável em https://pr-54.nova-wing-preview.pages.dev, não um aceite estético.

## Design intent

Unificar nave e robô numa família estética de **mecha aeroespacial de combate**: elegante, agressiva, tecnológica e legível durante gameplay. Evitar silhueta arredondada, brinquedo ou robô simpático, mesmo que o jogo tenha os Five Cats como protagonistas.

## Contratos da forma robô (NW-24, P0 visual)

- Silhueta angular, atlética, torso com cintura definida, pernas e braços proporcionais, ombros mecânicos fortes; evitar corpo bulboso.
- **Asas grandes**, ligadas ao alto das costas e ombros, com múltiplos painéis, articulações, recortes e leitura vista de frente, perfil e costas.
- **Propulsor principal alto nas costas**, centralizado entre ombros/escápulas; nunca na altura do quadril/glúteos. Thrusters secundários e luzes de energia são opcionais mas devem explicar o voo.
- Cabeça com visor/capacete tecnológico, sem aspecto infantil; linhas do peito, armadura, encaixes, engrenagens, juntas, ventilação e linhas mecânicas visíveis.
- Braços elevam-se ao disparar: pose de mira clara e legível, recuo por arma, transição e retorno suaves; canhões não atravessam a carcaça ou as asas.
- Metais claros com estrutura grafite/azul-escuro, acentos ciano e detalhes quentes pontuais, preservando cores selecionadas de cada piloto.
- Transformação reversível, com interpolação coerente de painéis/asa/turbina, sem troca instantânea visualmente desconectada.

## Contratos de evolução das naves (P1 visual)

- Nariz e fuselagem mais afiados e aerodinâmicos, painéis sobrepostos, linhas técnicas e cockpits definidos.
- Envergadura e geometria das asas devem **corresponder** às asas usadas no robô; o jogador deve reconhecer a mesma máquina transformada.
- Mesmo material, esquema de iluminação, thrusters e assinatura cromática na nave/robô.
- Preservar diferenças de chassis e pintura por piloto; não padronizar as cinco naves numa cópia sem identidade.
- Não alterar hitboxes, cadência, energia, progressão nem perks em um PR exclusivamente visual sem nova spec.

## Critérios de aceite em preview

1. Capturas frontais, traseiras, laterais e 3/4 em voo, no hangar e em combate. Comparação visual com o conceito aprovado.
2. Turbina no **alto** das costas, asas claramente maiores, armas e braços elevados sem interseção ou obstrução da mira.
3. FPS, tamanho do HTML, regressão WebGL desktop/mobile, transição nave↔robô e uso dos cinco gatos.
4. Visual claro sobre os fundos coloridos da PR #51, com destaque dos projéteis e weak spots dos chefes.
5. Aprovação manual explícita do mantenedor **antes de promoção a DEV/HML**. CI verde sozinha não homologa a arte.

## Trabalho paralelo

A modelagem/animação prossegue no preview #54. Em paralelo, corrigir P0 HUD mobile, rotas e qualidade, evoluir som de transformação e criar novas naves como PR independente. HML deve receber apenas candidata visual aprovada, sem juntar alterações desconexas antes de revisão.

**Referência visual:** prancha conceitual aprovada na conversa; arquivo de imagem ainda não anexado ao repositório como asset de design versionado. Este texto mantém os critérios de implementação auditáveis até a inclusão formal do asset.
