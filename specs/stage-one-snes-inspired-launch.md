# Abertura de lançamento da fase 1

## Objetivo

Transformar os cinco segundos iniciais de Cidade das Máquinas em uma decolagem clara de quatro planos: hangar amplo, gato piloto selecionado, saída frontal e câmera jogável. A referência é o ritmo da saída do hangar de _Star Fox_ (Super Nintendo), sem reutilizar modelos, áudio, falas ou cenas protegidas.

## Contratos

- Apenas setor 1 e apenas quando `enableSquadIntro` estiver ativo.
- Conserva duração de cinco segundos para não alongar o tempo sem controle ou alterar os testes existentes.
- Relógio da missão, spawns, colisões e BOOST obrigatório continuam suspensos durante a apresentação da formação.
- O hangar é geometria visual temporária, removida do render após a decolagem e descartada no encerramento.
- As cinco naves aparecem. O piloto selecionado lidera com a própria nave do gameplay no centro; as quatro naves de escolta usam os modelos e as cores oficiais de cada gato.
- Reduzir a montagem de seis tomadas rápidas para quatro planos legíveis: hangar inteiro, gato piloto selecionado, portas vistas da frente e câmera de perseguição. O jogador entende a saída da base sem cortes bruscos.
- A nave central não é duplicada, substituída nem repintada durante a transição. A história opcional também respeita a seleção de modelo, cor e piloto.
- O hangar tem teto, pilares, portas, iluminação de pista e área de apresentação do gato selecionado, cujo modelo 3D segue o hangar.
- Não há teleporte da nave do jogador: o líder termina na mesma posição do jogador. As demais naves abrem a formação ao final.
- Pausa congela a animação e reinício recompõe a cena. Pular a história inicial preserva a decolagem do hangar; fases seguintes e laboratório não exibem hangar.
- O botão Pular e as teclas Enter, Espaço e Escape ignoram apenas a história opcional, não o lançamento jogável.
- Antes da primeira missão, o mapa de campanha oferece o treino opcional de comandos no mesmo chassi/pintura do jogador. O simulador 3D ensina movimentos, tiro, BOOST, giro, transformação e troca de câmera, com teclado e botões touch.
- Treino não inicia o cronômetro, nem spawns, nem danos, nem pontuação, nem altera saves. Jogador pode voltar ao mapa ou iniciar diretamente a mesma missão.
- O segundo contexto WebGL do treino é criado sob demanda e destruído ao fechar, sem gasto de GPU durante a missão.
- Mobile em portrait comprime a abertura da formação e mantém os textos no trilho de avisos já existente, sem adicionar HUD.
- Áudio de ignição reaproveita cues existentes e respeita o mute.

## Aceite

1. Em câmera real, observam-se as portas abrindo antes da partida e o hangar recuando durante a aceleração.
2. A nave central usa a mesma instância 3D do jogador com modelo e pintura selecionados. As outras quatro naves não duplicam esse piloto.
3. A câmera final está alinhada à câmera normal e não deixa controles travados.
4. Missão tem 0 segundos decorridos no fim da entrada e libera movimentação e disparos no quadro seguinte.
5. A sequência não afeta a fase 2, retry, pausa ou o início acelerado de QA.
6. Testes determinísticos conferem quatro câmeras, simetria dinâmica, identidade do piloto, cores e modelos, e descarte de meshes.
7. Validar visualmente em desktop e mobile e executar gates de CI antes de merge.

## Robustez do treinamento (19/11/2026)

- A câmera 3D reutiliza o vetor de interpolação e só atualiza tamanho/projeção quando as dimensões visíveis mudam, evitando alocações e chamadas de resize por frame.
- A transformação nave/robô preserva posição e orientação da forma anterior; não há salto de volta à origem do simulador.
- O teste `preflight-practice.test.mjs` protege a continuidade bidirecional da pose, além da conclusão dos seis comandos e do isolamento do progresso da campanha.
- A saída para o mapa ou para a missão descarta o renderizador secundário. A integração exige `build:check`, `validate`, `quality` e seis shards de navegador verdes no SHA final.
- O PR permanece em draft. Nenhum merge ou deploy de produção é autorizado por esta especificação.


## QA de regressão: treino modal e skip explícito, 19/11/2026

- O mapa fica oculto enquanto o simulador está aberto, não captura cliques
  do botão **INICIAR MISSÃO** e só reaparece no comando **VOLTAR AO MAPA**.
- Os cinco segundos da decolagem permanecem intactos. O piloto pode optar
  por **PULAR DECOLAGEM**, preservando relógio, checkpoint, seleção e cor.
- Pular oculta a baía e as quatro naves auxiliares da sequência, restaura
  a câmera de gameplay e libera controles sem iniciar um segundo jogo.
- Botão invisível após intro, em pausa e nas outras fases. Os testes de
  combate seguem o mesmo fluxo visível que um usuário que pula a abertura.
- QA visual em iPhone físico e seis shards Playwright seguem obrigatórios.
