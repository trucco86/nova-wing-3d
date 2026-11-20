# QA visual | Órbita-9 com identidade da Devastador

Candidata v1.27.157, PR #417 sobre #416. Qualquer aprovação é
exclusivamente para esta branch de QA, não para produção.

## O que comparar com a fase 04

- [ ] Paleta e contraste de blindagem, aço, conduítes e luz ciano/âmbar/vermelha.
- [ ] Sensação de entrar em uma estação gigante, com vigas e guindastes acima do piloto.
- [ ] Laboratório oeste: terminais diagnósticos facilmente reconhecíveis.
- [ ] Praça do reator leste: módulos de resfriamento que não ocultam a pista.
- [ ] Arquivos no sudoeste: bancos de memória e porta blindada ao final.
- [ ] Átrio central: núcleo industrial sem anéis repetitivos e sem corredor genérico.
- [ ] Sem objetos decorativos atravessando ou escondendo o piloto.
- [ ] Câmera seguir e panorâmica conseguem ler os quatro distritos.
- [ ] No celular, 390 × 844 e 844 × 390, HUD, joystick e BOOST seguem sem obstruções.

## Gates funcionais de regressão

- [ ] Cinco pilotos com a mesma arte da seleção, caminhada e parada preservadas.
- [ ] Colisões iguais às da v1.27.156 e três pistas em suas posições originais.
- [ ] NPC, diálogo, escolha de rota e gate de combate permanecem funcionais.
- [ ] Sem alteração de save, Firebase, ranking ou progressão da campanha.
- [ ] Build reproduzível, formatação, lint, Node e Playwright verdes.
- [ ] Evidência de screenshots e revisão humana em aparelho físico.

A cena usa instâncias estáticas para peças repetidas. Ganho de FPS não foi medido,
portanto não deve ser afirmado antes de benchmarks no dispositivo.

## Revisão de screenshots e regressão de câmera

- Capturas iniciais mostraram metal escuro, piloto pequeno e grandes painéis
  atravessando o enquadramento da praça do reator.
- Ajustados a iluminação, o acabamento do aço, a distância da câmera, a
  altura das passarelas e o formato aberto das torres de resfriamento.
- O teleporte de Developer/QA agora reposiciona a câmera instantaneamente
  junto ao piloto. Antes, o movimento interpolado da câmera atravessava
  paredes ao alternar rapidamente entre regiões para fotografar a cena.
- Corrigida a interceptação de Escape pelo menu de título enquanto o diálogo
  do sobrevivente está aberto na exploração.
- A bateria focada anterior teve 16 testes Playwright aprovados em desktop e
  mobile; o novo teste exige a câmera junto ao piloto após cada teleporte.

Permanece necessária revisão visual em aparelho físico. Captura automática
não é prova suficiente de experiência de jogo ou desempenho de GPU.
