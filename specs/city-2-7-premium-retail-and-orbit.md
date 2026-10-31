# City 2.7 — ruas comerciais, horizonte monumental e subida orbital cinematográfica

## Problema observado e alvo perceptivo

A avenida da primeira fase ainda parecia uma pista urbana gerada proceduralmente. O jogador pediu shoppings, lojas, estruturas diferentes, um marco monumental à frente e uma transição cidade→espaço sem corte repentino. Terra, Lua e Sol devem compor uma órbita terrestre legível. A imagem premium é referência de direção de arte, não evidência de fidelidade fotorrealista já obtida.

## Implementado na candidata isolada

### Cidade viva e escala
- 3 shoppings/centros comerciais com nome e letreiro local gerado por CanvasTexture: ORBITAL PLAZA (direita), NOVA MARKET (esquerda), SKYLINE MALL (direita).
- 16 lojas distribuídas pelos blocos da cidade: fachada envidraçada, marquise, pisos elevados, luzes quentes e frias, módulos de entrada e painéis.
- Pequenos quiosques e praça de acesso nos shoppings. Posição lateral sempre |x|>90, fora do corredor de voo e do monotrilho; sem hitboxes.
- Objetos-base agregados em malhas instanciadas para Médio e Alto; somente esquadrias de detalhe e janelas extras aparecem no Alto.
- Megaconstrução única no horizonte, **Citadel Spire**: dois mastros laterais, anel orbital, torre central, ponte aérea e balizas. É um alvo visual de profundidade e desaparece junto com a cidade, sem bloquear tiros.
- Preserva os trens animados, fachadas, outdoors, distritos e piso da Cidade 2.6.

### Transição órbita
- Mantém a fase atmosférica de 38 segundos e o BOOST obrigatório. A suavização ocorre pela direção visual e fade, não por alteração do cronômetro ou da progressão de chefe.
- Cidade, monorail, fachadas e skyline descem suavemente, com fog e escala progressivos; não são escondidos no limiar inicial de desbloqueio de obstáculos espaciais.
- Revelação cruzada: luz solar começa durante a subida, seguida de Terra abaixo do horizonte e Lua separada, até a cidade estar fisicamente fora do campo da câmera.
- Terra procedural com oceanos, continentes, neve polar, nuvens e iluminação de cidades noturnas, terminador e atmosfera luminosa. Nuvens e halo atmosférico adicionais apenas no Alto.
- Lua real de cena separada da Lua fictícia/fraturada de outros setores, com relevo procedimental e iluminação lateral.
- Sol como disco brilhante com dois halos aditivos em DataTexture local, sem dependência externa, presente em Médio e Alto.
- Todo elemento celestial volta ao estado invisível em outros setores e no reset.

## Validação automática
- Verificar 3 shoppings, 16 lojas, fachadas, marquises, shaders/texturas offline, batches de GPU e afastamento do corredor central.
- Verificar megaconstrução e composição central distante sem hitboxes.
- Verificar progresso contínuo 44%→70%→85%→100% do fade de Terra e deslocamento urbano, e reset.
- Verificar opção Alto/Médio, manutenção de BOOST necessário, 38 s até órbita e ausência de bloqueios no período atmosférico.
- Executar format:check, lint, testes Node, validate, build:check e Playwright 4/4 no SHA final.

## Homologação visual e performance pendentes
1. Em 1366×768, 844×390 e 390×844, identificar os shoppings, a citadel ao fundo e a passagem do trem nos primeiros segundos. Capturar imagens reais do jogo e comparar com 2.6.
2. Seguir a fase completa: cidade → BOOST obrigatório → atmosfera de 38 s com revelação progressiva → Terra, Lua e Sol → chefe; avaliar cortes visuais, cintilação e qualidade da luz.
3. Medir 30 segundos de FPS e p95 frame-time em equipamento real, em Médio e Alto. Alvos, **não medições**: 60 FPS desktop, 30 FPS mobile.
4. Conferir a leitura do HUD e mira sem poluição do centro; lembrar que shoppings são estruturas visuais e não minijogos/lojas interativas.
5. Nenhum merge para DEV/HML/PROD antes de CI completo e homologação humana. A PR base City 2.6 (#188) ainda está em QA.
