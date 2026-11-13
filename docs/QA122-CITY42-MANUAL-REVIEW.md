# QA122 | Revisão visual da cidade premium 4.2

Candidata isolada **1.27.122**. Este roteiro registra o que precisa ser observado em WebGL real antes da homologação. Não autoriza merge nem publicação.

## Abertura da Fase 1

- [ ] A Lua rachada aparece no céu distante, atrás de todos os prédios que cruzam seu disco, inclusive na ascensão inicial e em tela de celular.
- [ ] O relevo da Lua mostra crateras e superfícies irregulares. As fissuras âmbar são visíveis, mas não escondem os detalhes.
- [ ] A paleta da cidade continua neutra e quente, sem voltar ao excesso de rosa e azul.
- [ ] Calçadas, postes, árvores e térreos das torres estão apoiados no solo, sem atravessar outros objetos.
- [ ] Pedestres discretos se movimentam apenas dentro dos passeios, e permanecem parados com o jogo pausado.
- [ ] Os painéis dos abrigos e as telas de publicidade fictícia estão apoiados em estruturas reais. Não há outdoors flutuantes.
- [ ] Os néons alternam tons discretos sem prejudicar a leitura dos inimigos e da mira.
- [ ] A nave continua livre no corredor permitido; nenhum novo adereço cria colisão invisível.

## Subida para o espaço

- [ ] A Lua rachada da cidade desaparece antes da apresentação do satélite orbital.
- [ ] A Lua orbital apresenta crateras e o mesmo desenho de fissuras, mantendo continuidade visual.
- [ ] A Terra, o céu e os edifícios conservam suas transições anteriores sem objetos aparecendo sobrepostos.

## Evidência automatizada

O teste WebGL direcionado passou no Chromium desktop e mobile para a versão com a Lua no fundo da cidade: [execução e artefatos](https://github.com/trucco86/nova-wing-3d/actions/runs/43431363007). A preparação de release e o browser FULL no commit final continuam sendo gates independentes.

## Revisão adicional das quadras externas

- [ ] O exterior tem quadras pequenas e verossímeis desde a abertura até o fim do percurso, nos dois lados, não uma superfície lisa.
- [ ] Estacionamentos, jardins, vias de acesso, praças, pátios técnicos e entregas têm estrutura e propósito visual; veículos não flutuam.
- [ ] As áreas novas são vistas de cima e ao passar entre prédios, sem interpenetrações com torres, shoppings ou plataformas do espaçoporto.
- [ ] As quadras continuam alinhadas com o tile durante a rolagem, pausa e ascensão; não surgem paredes ou colisores invisíveis.
- [ ] O teste visual compara o antes e depois em Medium/High no desktop e celular, incluindo os extremos do percurso e os diferentes ângulos de câmera.
- [ ] Render stats e FPS físico confirmam que os novos elementos não pioram o desempenho; a contagem de sete batches de QA122 por tile permanece constante.

## Qualidade e regressões

- [ ] Capturas desktop e celular em Medium e High, abertura, seis segundos de percurso e ascensão.
- [ ] A comparação GPU verifica o novo batch instanciado de árvores, sem flexibilizar os limites anteriores de triângulos e chamadas de desenho.
- [ ] Playwright completo de quatro shards, teste de colisões, navegação, pausa, reinício e cenas das demais fases.
- [ ] Medição de FPS e áudio em celular físico antes de recomendar promoção da candidata.

**Critério de bloqueio:** falha de shader, Lua à frente de um prédio, hitbox fantasma, FPS degradado ou CI vermelha impedem homologação e merge.
