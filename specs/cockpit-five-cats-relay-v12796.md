# Nova Wing QA v1.27.96 — cockpit Five Cats e troca de comando

## Requisitos confirmados

- O cockpit mantém a visão de voo livre e ganha telemetria REAL: velocidade de deslocamento calculada pelo jogo, arma equipada, integridade, energia, piloto e radar tático de ameaças relativas.
- Patas 3D sobre comandos aparecem dentro da câmera e acompanham movimento e boost; cor do pelo e escala são definidas pelo piloto (não o matiz genérico do HUD). Geometria reaproveitada, sem criar malhas por quadro.
- Ao pedir TROCAR / tecla M durante a luta, a próxima nave do esquadrão assume após troca instantânea, com invulnerabilidade curta (0,8s) e cooldown de 9s. Pilotos mantêm seu próprio chassi e cor associados à missão, selecionados deterministicamente a partir da configuração inicial. O casco ativo mantém o **percentual** de integridade, evitando cura infinita.
- Quando integridade chega a zero, é a **nave avariada** que se retira. Piloto segue vivo, chassi avariado fica indisponível até a próxima fase. Outra nave com outro gato assume após a janela original de reposição, sem alterar o checkpoint de recompensa. O limite de 3 naves da campanha é mantido; terceira perda encerra a tentativa.
- A HUD muda de VIDAS para NAVES, nunca anuncia morte de gatos.
- Diferenciais: atributos de piloto já afetam dano, mobilidade, escudo, bomba e arcana; chassi SPECTER recebe +6% ataque e AEGIS -6% ataque em troca de blindagem, preservando NOVA-7 base. A velocidade instrumentada é o valor real do jogo, não constante fictícia.
- Troca exige missão em execução; bloqueada em menu, pausa, animação inicial e cooldown. Desativa transitoriamente forma robô para substituir a nave com segurança. Não substitui mecânicas de orbitar ou lock-on.

## Critérios de aceite

1. Troca durante batalha altera piloto, HUD, visual, modelo, força, velocidade e escudo; mantém posição, % de integridade e não duplica rewards; segunda troca imediata bloqueada.
2. Dano terminal avaria nave, troca por outro gato, preserva 3 chances e não emite mensagem de morte. Pausa, novo setor e reinício não conservam cooldown/retirados inconsistentes.
3. Cockpit desktop e mobile mostram dados coerentes com snapshot da partida, ameaças no radar e duas patas específicas ao piloto, sem bloquear mira.
4. Testes Node, CI browser desktop/mobile, screenshots comparados e FPS em dispositivo real antes de qualquer homologação; preview separado de PROD.
