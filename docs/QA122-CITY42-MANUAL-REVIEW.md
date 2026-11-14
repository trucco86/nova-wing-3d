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

## Evidência QA das quadras externas

- A preparação da versão 1.27.122 com `release:prepare`, `format`, `build`, testes direcionados de cidade e `npm run validate` passou: [GitHub Actions #43435009050](https://github.com/trucco86/nova-wing-3d/actions/runs/43435009050).
- A cobertura inclui os dois lados do cenário, todos os tipos de quadras, a não interpenetração de lotes, pavimentos encostados no solo, continuidade da Lua e regressões de cena.
- A validação WebGL desktop/mobile e o gate FULL de quatro shards no SHA final precisam de evidência própria; FPS em aparelho físico permanece manual.

## Revisão adicional das quadras externas

- [ ] O exterior tem quadras pequenas e verossímeis desde a abertura até o fim do percurso, nos dois lados, não uma superfície lisa.
- [ ] Estacionamentos, jardins, vias de acesso, praças, pátios técnicos e entregas têm estrutura e propósito visual; veículos não flutuam.
- [ ] As áreas novas são vistas de cima e ao passar entre prédios, sem interpenetrações com torres, shoppings ou plataformas do espaçoporto.
- [ ] As quadras continuam alinhadas com o tile durante a rolagem, pausa e ascensão; não surgem paredes ou colisores invisíveis.
- [ ] O teste visual compara o antes e depois em Medium/High no desktop e celular, incluindo os extremos do percurso e os diferentes ângulos de câmera.
- [ ] Render stats e FPS físico confirmam que os novos elementos não pioram o desempenho; oito batches por tile (oito apenas no perfil High) permanecem constantes após a inclusão do vapor.

## Revisão 4.4: solo cinematográfico e impactos

- [ ] Entre as torres, não há grandes regiões de piso liso sem leitura de textura, juntas, travessia, drenagem ou áreas de serviço.
- [ ] O preenchimento do chão respeita todos os prédios, plataformas e lotes ocupados, sem superfícies se cruzando.
- [ ] O chão permanece alinhado aos dois tiles durante scroll, pausa, reset e ascensão.
- [ ] O vapor nasce em grelhas, não atravessa torres e aparece apenas no modo High. Medium mantém pisos e sinalização, preservando FPS.
- [ ] Impactos de outdoor, carro e fachada têm calor inicial, faíscas, fragmentos, poeira e fuligem; queimaduras temporárias tocam o chão.
- [ ] Nenhuma explosão cria hitbox invisível, altera a trajetória dos detritos, escala dano ou adiciona malhas durante a animação.
- [ ] O orçamento de 8 batches por tile (5 Medium, 3 High) e 3 batches globais de fragmentos de impacto é registrado em QA, sem ampliar a tolerância do cenário original.
- [ ] A diferença visual é perceptível também no celular e em diversos ângulos, sem comprometer FPS ou visibilidade de inimigos.

**Evidência de build/Node no código 4.4:** [preparação QA122 aprovada](https://github.com/trucco86/nova-wing-3d/actions/runs/43447371288). Não substitui os shards de navegador nem testes em aparelho físico.

## Qualidade e regressões

- [ ] Capturas desktop e celular em Medium e High, abertura, seis segundos de percurso e ascensão.
- [ ] A comparação GPU verifica o novo batch instanciado de árvores, sem flexibilizar os limites anteriores de triângulos e chamadas de desenho.
- [ ] Playwright completo de quatro shards, teste de colisões, navegação, pausa, reinício e cenas das demais fases.
- [ ] Medição de FPS e áudio em celular físico antes de recomendar promoção da candidata.

**Critério de bloqueio:** falha de shader, Lua à frente de um prédio, hitbox fantasma, FPS degradado ou CI vermelha impedem homologação e merge.
