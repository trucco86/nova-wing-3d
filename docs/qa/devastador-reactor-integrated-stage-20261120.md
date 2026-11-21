# Devastador, fase 04: acesso ao reator integrado

## Sequência jogável única

1. A fase 04 começa com o voo, aproximação e combates da Devastador.
2. Após 74% da duração prevista e sem subchefe ativo, o voo é suspenso para o desembarque no interior da mesma nave.
3. O piloto selecionado percorre os distritos com caminhada, joystick, BOOST, giro 360 e órbita já existentes.
4. Os três módulos passam a ser Circuitos, Refrigeração e Motores, ativados individualmente com feedback e minimapa.
5. Somente após as três ativações é possível acessar o reator.
6. O jogo retorna ao mesmo setor 04 e inicia o chefe original, permitindo destruir seu núcleo e pontos fracos.
7. A conclusão e o checkpoint permanecem no fluxo original da campanha.

## Política de estado

- O estado reactor-access suspende combate, projéteis e relógio durante o desembarque.
- Não há nova fase, stageId, placar, ranking, desbloqueio ou chave de save independente.
- O botão Pausar/Menu abre a pausa normal e a tentativa continua no fluxo da fase.
- Os três módulos são obrigatórios; IDs faltantes, repetidos ou inválidos não liberam o núcleo.
- Reiniciar a fase restaura a trava. Selecionar chefe direto no laboratório QA permanece isolado.
- Arquivos em PR Draft, sem merge/deploy de produção.

## Aceite

- [ ] Fase 04 abre a exploração no meio da missão, sem botão de fase separada.
- [ ] Setores 01, 02, 03, 05+ não são interrompidos.
- [ ] Ativar 1 ou 2 módulos não libera o chefe.
- [ ] Ativar os 3 módulos abre o reator.
- [ ] Retorna ao mesmo setor, com o piloto, score e equipamentos preservados.
- [ ] Chefe mantém os sistemas de sabotagem e destruição do núcleo.
- [ ] Pausa não pula a trava.
- [ ] Mobile mantém analógico, órbita, 360 e BOOST acessíveis.
- [ ] Testes Node, browser e build reproduzível aprovados em QA.
