# QA v1.27.99 — pilotagem vertical, colisões dos viadutos e clareza de HUD

## Problemas de jogabilidade reportados
- A nave para de subir artificialmente em y=46; há travessas de viadutos renderizadas em y=59..73 e estruturas em altitude superior, mas os controles não alcançam essa região.
- O elemento `BLINDADO` do HUD ocupa espaço excessivo na linha de visão. Diferenciar o estado blindado da marcação de ponto fraco, que deve continuar legível.
- Há elementos de destruição que ainda aparentam ser atravessáveis. Não substituir volume de colisão por dano ou uma parede invisível; garantir que a janela física acompanhe toda a janela visual da cidade.
- `city-elevated-crossings` contém decks e travessas sem corpo físico, e `city32-maglev-crossing-guideway` é totalmente visual. Apenas pilares e trens laterais estavam representados no mecanismo.

## Contratos
1. Na fase 1, W/↑/joystick sobe continuamente até y=116; nas outras fases 3D até y=96, com acompanhamento da câmera em chase/cockpit/combate. Sem alterar as zonas de paredes de cavernas definidas pela geometria daquela fase. O limite inferior y=-1 e o espaço lateral x±72 continuam. O teto aumentado não é um bloqueio visual em cena; evita somente sair do espaço máximo simulado; a câmera mantém a nave visível durante todo o deslocamento.
2. O resolvedor de colisões recebe o novo limite vertical e só impede atravessar **formas realmente visíveis**. Travessia de uma viga horizontal exige passar por cima ou por baixo, não inventar uma barreira fora da viga. As travessas dos nove viadutos de cada tile, com largura/altura/espessura dos próprios `InstancedMesh`, e a plataforma transversal de maglev entram no cache físico, respeitando visibilidade de gráficos Alto/Médio, posições relativas do tile e reciclagem sem teleporte no sweep.
3. Os objetos em queda continuam sincronizados com malhas visíveis e CCD XYZ. A detecção só acaba quando a cidade efetivamente deixa de ser visível, não ao atingir uma cota arbitrária de recuo vertical. Um choque real aplica dano + impacto e impede a nave de terminar dentro do sólido. Rotas laterais e vertical acima do obstáculo permanecem disponíveis.
4. `BLINDADO`: reduzir tipografia, padding, box-shadow, opacidade do fundo/borda e deslocar mais próximo do marcador. Manter ponto fraco com contraste e feedback originais.

## Matriz de validação
- Regressão Node: movimento y=46→116 com W, câmera acompanha, soltar comando estabiliza, x±72, limite superior após teclas longas, reset e fase Marte y>46 sem quebrar as outras zonas.
- Física Node: deck central e trilho transversal interceptam caminho quando y coincide e z cruza o modelo; acima e abaixo dos volumes o caminho fica livre, incluindo dash/boost e 30/60/120 Hz.
- Gráficos Médio: viaduto High oculto não tem collider, mas trilho transversal Médio continua bloqueando em sua espessura real.
- Browser desktop/mobile: navegar do chão até acima dos viadutos, medir posição/câmera, comprovar choque com as travessas e desvio seguro, e conferir visibilidade/física de destroços reais.
- CSS/browser: marcador BLINDADO menor e menos opaco, sem afetar estado FRACO.
- CI full (Node + quatro shards Playwright), screenshots e validação FPS em hardware físico antes de liberar produção. Não atualizar main nem PRs anteriores sem homologação.
