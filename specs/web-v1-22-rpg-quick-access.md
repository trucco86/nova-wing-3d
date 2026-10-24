# RPG acessível durante o voo — web v1.22

- Arma, especial e ativação ficam em uma barra RPG compacta sempre visível durante o
  voo web. Teclas F/H/G e os mesmos comandos de toque continuam chamando as funções
  existentes; não há segundo estado de equipamento.
- A gaveta fechada identifica o nível atual. Ao abrir, mostra XP, bônus efetivos de
  ataque, escudo, agilidade e arcana, além do próximo desbloqueio e seu nível.
- Troca de arma ou especial fica visualmente desabilitada enquanto só existir uma opção,
  mas a ativação do especial inicial permanece disponível quando houver energia.
- A barra não cobre o corredor central, controles de movimento, ações, órbita ou alertas
  nos viewports desktop e mobile. No retrato, a ativação ocupa uma linha própria.
- No celular, escudo e RPG ocupam a zona superior; chefe e radar começam abaixo desse
  bloco. Carga e impulso são anéis nos próprios botões, bombas exibem contador e todas
  as cinco ações principais preservam alvos de toque de pelo menos 60 px.
- Impactos bloqueados usam um marcador compacto no ponto real, sem etiqueta sobre a
  nave, o alvo ou o corredor de mira.
- Dano, custos, limiares de XP, atributos dos pilotos, naves, checkpoints e o canal
  nativo permanecem inalterados. A entrega segue web-first.

## Evidência

Testes puros validam a descrição dos bônus e a ordem dos desbloqueios. O harness confirma
que comandos bloqueados não mudam a seleção e são liberados pelo XP real. Playwright
exercita a barra sem abrir a gaveta e registra estados fechado/aberto em desktop e mobile.
