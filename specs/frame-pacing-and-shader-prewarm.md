# Qualidade de frames nas transições e batalhas de chefes

## Problema observado
Usuário relata microtravadas na transição da órbita para o solo, na entrada do chefe e na primeira revelação dos pontos fracos. O tempo de frame pode ser afetado por (1) geração procedural de centenas de peças do chefe em `makeBoss`; (2) compilação tardia de shaders para malhas inicialmente invisíveis; (3) upload de milhares de buffers geométricos individuais; (4) alocações desnecessárias no hot path da animação da névoa.

## Contratos
- O boss da próxima fase deve ser construído uma única vez durante a preparação da fase e mantido fora da cena até a aparição. Quando entrar na arena, a mesma instância, com os mesmos pontos fracos, baterias e materiais, deve ser usada.
- Mudança de fase ou reinício descarta o boss ainda não utilizado; encerramento da campanha também libera recursos. O jogo não deve cachear todos os dez chefes simultaneamente.
- Quando `WebGLRenderer.compileAsync()` estiver disponível, o carregamento agenda pré-compilação assíncrona de materiais da paisagem oculta, atmosfera e chefe, incluindo as retículas dos pontos fracos. Estados `visible` devem ser restaurados no mesmo turno, sem flashes ou revelar prematuramente os alvos. Falhas ou ausência da API não bloqueiam gameplay.
- Peças de blindagem retangulares reutilizam uma malha base no GPU. Transformações, formatos, zonas de dano, paletas de cor e comportamento aprovado não devem mudar. Geometrias globais compartilhadas não podem ser descartadas enquanto outros chefes/modelos ainda dependem delas.
- Cor da névoa marciana e de outros destinos deve ser calculada reutilizando `Color` existente, sem criar novas instâncias a cada frame. Pausa, relógio determinístico e reset mantêm a mesma cena.
- Alterações não podem introduzir trabalho pesado síncrono quando o chefe aparece. Não degradar visibilidade dos indicadores de ponto fraco.
- Meta de homologação: comparar distribuição de frame time e eventos acima de 33/50 ms antes/depois em aparelho real usando Pausa → FPS, nos momentos de 1ª exibição de pontos fracos, chegada do chefe e entrada/saída de cenário. CI SwiftShader é guarda de regressão, não prova de FPS em hardware real.

## QA
- Node: identidade da instância preparada vs. instância de batalha; descarte em reinício; pré-compilação cobre retículas ocultas e restaura visibilidade; fallback para WebGL sem `compileAsync`; pooling de geometria mantém limites.
- Browser: ausência de erros WebGL e screenshots de todas as 10 silhuetas, transições Marte e destinos espaciais e testes com canvas real em desktop/mobile.
- Gates: `npm run format`, `npm run build`, `npm run validate`, `npm run validate -- --browser`; manter PR em draft caso algum falhe.
