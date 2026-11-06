# Mecha Premium V4 — concept art, articulação e propulsão

## Direção visual
Priorizar a direção visual premium aprovada para o Nova Wing: armadura metálica angulada (Gundam/Tron), desenho coerente com a nave, painéis ciano/azul, núcleo luminoso e propulsão laranja quando em BOOST, sem perder a silhueta das asas do fighter original. A referência de cena mostra naves com **dois motores visíveis e exaustão branca-azul/âmbar** sobre uma metrópole futurista noturna. O mecha mantém seus pontos de geometria atuais; não se pretende reproduzir literalmente um modelo 2D por meio de malhas low-poly sem validação visual.

## Critérios de aceite do gameplay
- **Ações do braço:** canhão direito recua com cada disparo; o antebraço, guantelete e canhão acompanham um pivô de cotovelo real, não um grupo vazio. O braço esquerdo continua com mira independente para o lock-on e reage de modo próprio ao tiro de precisão.
- **Navegação:** inclinação do tronco em contramovimento, cabeça estabilizada, quadris/coxas e joelhos realmente articulados durante deslocamento lateral e ascensão; asas reagem às manobras e ao BOOST sem perder o mesmo perfil da nave.
- **Propulsão premium:** duas turbinas vetoriais dorsais com anéis metálicos, núcleo, rotor e duas camadas de plasma; reator central + exaustão lateral. Em velocidade de cruzeiro, chama ciano/azul; em BOOST, laranja/âmbar com núcleo branco, aumento de comprimento e rotação. Pequenos jatos de correção acendem em manobras laterais.
- **Continuidades:** preservar transformações T, tamanho e limites de colisão, posição de cada muzzle, poderes, cadência, estratégia e HUD aprovados; nenhum elemento obscurece gameplay. Não adicionar luzes dinâmicas nem novos efeitos/objetos por frame; manter GPU leve no mobile.
- **Temporalidade:** animação suave, determinística e proporcional ao delta, estável a 30/60 fps; pausa congela juntas, exaustão e rotores; próximo setor ou reinício restaura poses e energia visual.
- **Qualidade:** cenários 1 e 2, chefes e combate não mudam nesta entrega. Mudança afeta exclusivamente apresentação do mecha e feedback de tiro/BOOST.

## Testes e homologação
- Unitários: hierarquia do rig e deslocamento real do muzzle/shin; recuo isolado entre canhões, camadas de propulsão e mudança de cor, rotors, controle direcional, pausa/reset, envelope de silhueta e ritmo 30/60 Hz.
- CI: format, release prepare, build reproducível, validate Node, Playwright desktop/mobile (screenshots e WebGL).
- Homologação visual: mecha de frente, perfil e costas em viewport desktop e mobile; BOOST, strafe, subida/descida, tiros normais e precisão, troca nave↔robô e menu hangar. Teste físico com medidor Pausa → FPS. Nenhuma alegação de paridade visual exata com concept sem revisão manual.
