# Devastador, fase 04: acesso ao reator integrado

## Sequência jogável única

1. A fase 04 começa com o voo, aproximação e combates da Devastador.
2. Após aproximadamente 62% da fase (cerca de 55 segundos), depois da defesa do reator e sem subchefe ativo, o voo é suspenso para o desembarque no interior da mesma nave.
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
- [ ] Atalho em Central → Developer/QA → TESTAR ACESSO AO REATOR · FASE 04
      abre este trecho dentro do setor 04, nunca uma fase extra.

## Verificações adicionais de estabilidade

- O motor de voo suspende seu próprio renderizador WebGL durante o desembarque, reduzindo concorrência de GPU com a exploração em celular.
- O relógio do setor 04 permanece parado enquanto os três módulos são ativados. O teste de navegador verifica esse congelamento.
- Os testes gerais de BOOST e disparo agora encerram a abertura antes de testar comandos, usando o fluxo compartilhado de início da missão.
- A patente ilustrada é conferida independentemente da capitalização do texto localizado.
- A homologação depende do Playwright focado, dos seis shards gerais e da revisão do aparelho físico, não apenas dos testes Node.

## Evidência da candidata de integração

- Build gerado e reproduzível; validação integral aprovada no job
  [44848119005](https://github.com/trucco86/nova-wing-3d/actions/runs/44848119005).
- Referência atual: v1.27.158. Entrada de desembarque por volta dos 55s
  da fase 04, após a defesa do reator; não existe uma fase independente.
- Faltam a conclusão dos testes Playwright sobre este commit e a revisão
  de gameplay em dispositivo físico antes do merge.
