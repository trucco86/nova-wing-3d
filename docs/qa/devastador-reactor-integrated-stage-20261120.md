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

## Polimento visual do desembarque

- Câmera de seguimento baixa: cerca de 11,8 m de distância em paisagem e 17 m em retrato, olhando adiante do piloto. O recuo em retrato mantém o gato inteiro e a arquitetura na tela; uma pequena extensão decorativa do piso evita vazio atrás do hangar. VISTA panorâmica continua independente.
- Estruturas da Devastador adicionadas no campo de visão de entrada: nervuras de hangar, pórticos de pressão, baias de manutenção, iluminação e guias de piso. Todas são instâncias decorativas, sem novos colisores nem interrupção da jornada.
- Minimap mostra somente os três módulos do reator, sem marcador de NPC da versão antiga. Átrio e arquivos agora usam a identificação Devastador.
- Testes registram capturas de QA 390×844 e 844×390, além da verificação de ângulo, distância e FOV da câmera de seguimento.
- Revisar as capturas reais e a velocidade de renderização em aparelho físico antes de homologar como arte final.

## Verificação de câmera responsiva

- Paisagem: mantém a aproximação da câmera e o enquadramento dos pórticos da Devastador.
- Retrato: recua a câmera e amplia o campo de visão para reduzir a proporção do gato na tela. O piso cosmético do hangar foi estendido para sustentar esse recuo sem mostrar vazio.
- Validação Node local da CI de sincronização: 12/12 testes específicos de câmera, locomoção, geografia e reator aprovados. Capturas finais e a suíte geral devem ser conferidas no commit de QA atualizado.
- A face do reator agora tem aros de energia e lâminas de refrigeração iluminadas sobre o colisor existente, com animação própria e nenhuma alteração de colisão.

## Checagem do reator energizado

- O núcleo exibe anel emissivo frontal animado e refrigeração mecânica detalhada, sem substituir o obstáculo físico existente.
- O teste específico de arte confirma dois elementos individuais de energia, instâncias de blindagem, ausência de novos colisores e animação determinística, com 9/9 verificações aprovadas na preparação da candidata.
- Revisão final das capturas em paisagem e retrato é obrigatória antes de homologar o aspecto visual.

## Redimensionamento no QA

- O teleporte do cenário de teste sincroniza as dimensões da câmera antes de fotografar após rotação de tela, evitando capturas com a distância do layout anterior.
- A orientação não muda a progressão, os módulos nem a posição física do piloto. O teste inclui as duas resoluções 390×844 e 844×390.

## V1.27.159, combate ativo do reator

- Entrada da arena: coluna central sem colisão removida. Os dois apoios laterais permanecem. Os parafusos e as linhas luminosas instanciadas foram retirados do centro do vão.
- Quatro robôs sentinelas exclusivos, sem pernas, presos às paredes por suportes hidráulicos. Cada busto possui cabeça, ombros e dois canhões reais articulados.
- Sentinelas ligadas aos quatro reguladores elétricos do núcleo: desligar/destruir um regulador desliga seu sentinela para o restante da luta.
- O reator alterna duas salvas dos robôs com um pulso triplo do núcleo. Cada ataque informa e trava a posição do jogador antes do disparo; movimento lateral e BOOST servem como defesa. Os projéteis usam a mesma física de colisão e dano da campanha.
- Não usar o mesmo modelo nem movimento de robôs de fases normais. Não adicionar uma nova fase, spawn de inimigo solto, teleporte ou save separado.
- Tiros da nave e do robô agora alternam o perfil anterior validado com duas assinaturas curtas novas que utilizam no máximo quatro vozes cada. Aviso, disparo dos robôs e pulso energético têm efeitos próprios de síntese, sem samples de terceiros.
- A saída do núcleo não muda: a vitória exige destruir os oito sistemas de sabotagem e então o núcleo central.

### Aceite objetivo

- [ ] Ao entrar no reator, nenhuma coluna falsa bloqueia o centro da tela.
- [ ] Quatro sentinelas de busto aparecem fisicamente nas paredes; não atravessam paredes ou se locomovem pelo ar.
- [ ] Sentinelas carregam e disparam do braço; os disparos podem acertar e tirar vida.
- [ ] O alerta é anterior ao disparo e o jogador consegue evitar o ponto de impacto com movimento.
- [ ] A terceira sequência é o pulso energético do núcleo; os ataques não ficam repetindo uma única animação.
- [ ] A destruição de cada circuito cancela o respectivo robô e a destruição dos restantes encerra as ofensivas.
- [ ] Testes Node, áudio, Desktop/Mobile Playwright, build reproduzível e validação física em dispositivo antes da produção.
- [ ] A PR continua Draft e nunca faz merge ou deploy de produção sem aprovação.

### Evidência técnica 21/11/2026

- O script de QA executou 18 testes específicos, todos aprovados, incluindo ataque real por projéteis, sentinelas associadas aos reguladores de energia, origem dos canhões, cancelamento de ataque, entrada sem coluna e quatro assinaturas novas de tiro.
- Build HTML sincronizado e validado no run 44881310233: `npm run validate` completo aprovado com 987 testes e nenhum erro; os seis arquivos de áudio preexistentes também preservaram seus contratos. A QA em navegador terá nova evidência dos sentinelas já abertos após o aviso.
- A captura do chefe agora usa avanço determinístico de 100 ms somente em Developer QA, em vez de percorrer 420 frames SwiftShader. O jogo real e os controles permanecem em tempo normal.
- A inspeção artística das capturas e o teste de som em aparelho físico ainda são pendências. Não publicar sem validar.
