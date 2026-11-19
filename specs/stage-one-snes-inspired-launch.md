# Abertura de lançamento da fase 1

## Objetivo

Transformar os cinco segundos iniciais de Cidade das Máquinas em uma decolagem com seis planos cinematográficos originais: hangar amplo, gato piloto selecionado, ignição lateral, saída frontal, decolagem acompanhada e passagem para a câmera jogável. A referência é o ritmo da saída do hangar de _Star Fox_ (Super Nintendo), sem reutilizar modelos, áudio, falas ou cenas protegidas.

## Contratos

- Apenas setor 1 e apenas quando `enableSquadIntro` estiver ativo.
- Conserva duração de cinco segundos para não alongar o tempo sem controle ou alterar os testes existentes.
- Relógio da missão, spawns, colisões e BOOST obrigatório continuam suspensos durante a apresentação da formação.
- O hangar é geometria visual temporária, removida do render após a decolagem e descartada no encerramento.
- As cinco naves aparecem. O piloto selecionado lidera com a própria nave do gameplay no centro; as quatro naves de escolta usam os modelos e as cores oficiais de cada gato.
- A nave central não é duplicada, substituída nem repintada durante a transição. A história opcional também respeita a seleção de modelo, cor e piloto.
- O hangar tem teto, pilares, portas, iluminação de pista e área de apresentação do gato selecionado, cujo modelo 3D segue o hangar.
- Não há teleporte da nave do jogador: o líder termina na mesma posição do jogador. As demais naves abrem a formação ao final.
- Pausa congela a animação e reinício recompõe a cena. Pular a história inicial preserva a decolagem do hangar; fases seguintes e laboratório não exibem hangar.
- O botão Pular e as teclas Enter, Espaço e Escape ignoram apenas a história opcional, não o lançamento jogável.
- Mobile em portrait comprime a abertura da formação e mantém os textos no trilho de avisos já existente, sem adicionar HUD.
- Áudio de ignição reaproveita cues existentes e respeita o mute.

## Aceite

1. Em câmera real, observam-se as portas abrindo antes da partida e o hangar recuando durante a aceleração.
2. As cinco naves permanecem identificáveis, sem desaparecer antes do encerramento.
3. A câmera final está alinhada à câmera normal e não deixa controles travados.
4. Missão tem 0 segundos decorridos no fim da entrada e libera movimentação e disparos no quadro seguinte.
5. A sequência não afeta a fase 2, retry, pausa ou o início acelerado de QA.
6. Testes determinísticos conferem progressão, simetria, câmera e descarte de meshes.
7. Validar visualmente em desktop e mobile e executar gates de CI antes de merge.
