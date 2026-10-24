# Nova Wing — Audio Direction & Implementation Spec v1

Status: especificação técnica; áudio novo NÃO integrado nem homologado.

## Identidade sonora
Criar uma trilha ORIGINAL de ficção científica cinematográfica, com tensão, mistério, exploração e combate de alta energia. Referências de clima: Panzer Dragoon Saga (percussão e ambiência épica) e filmes de mecha (peso mecânico). Não reproduzir melodias, samples, efeitos registrados ou assinaturas sonoras reconhecíveis.

### Paleta
- Exploração: drones harmônicos, sintetizadores analógicos, texturas aéreas, percussão esparsa, motivos curtos de mistério.
- Ameaça: pulso grave, ostinatos discretos, metais sintéticos, dissonância controlada.
- Combate: percussão híbrida tribal/eletrônica, subgraves curtos, motivos melódicos memoráveis, sem excesso de agudos.
- Boss: ritmo mais denso, camadas tensas, transições sincronizadas a fases e pontos fracos.
- Vitória: resolução harmônica curta e clara, sem interromper a próxima fase.

## Eventos de som — contrato inicial
| Evento | Gatilho | Camadas sugeridas | Aceite |
| --- | --- | --- | --- |
| ship.engine.idle | nave ativa | motor grave + ar sintético | loop sem clique |
| ship.engine.throttle | aceleração | pitch/volume dinâmicos | responde ao movimento |
| ship.boost.start | boost ativado | ignição + whoosh + grave | ataque imediato |
| ship.boost.loop | boost ativo | turbina sustentada | transição suave |
| weapon.laser.fire | disparo laser | transiente + corpo + cauda | variação de pitch e limite de vozes |
| weapon.plasma.charge | carregar especial | oscilação ascendente + energia | acompanha nível da carga |
| weapon.plasma.fire | disparo especial | ataque grave + descarga + cauda | mais pesado que laser |
| rocket.launch | lançamento | ignição + impulso + ar | distinguível do laser |
| rocket.flight | foguete em voo | assobio/motor espacial | posicionamento e distância |
| rocket.impact | colisão | impacto + subgrave + debris | não clipa |
| mech.transform.start | início da transformação | servo + travas | sincronizado ao início da animação |
| mech.transform.mid | peças em movimento | placas metálicas + engrenagens | sincronizado à troca de silhueta |
| mech.transform.end | conclusão | travamento + ativação de turbina | sensação de massa |
| mech.transform.reverse | retorno à nave | sequência mecânica reversa ORIGINAL | distinguível do modo robô |
| ship.damage.critical | HP crítico | pulso/alarme | prioridade sem mascarar gameplay |
| boss.weakspot.hit | acertar ponto fraco | impacto tonal e metálico | confirma acerto |
| pickup.collect | coleta | confirmação curta | não soa como minigame |

## Música adaptativa
Estados: menu, exploration, threat, combat, miniboss, boss, victory, defeat. Separar camadas de ambiência, ritmo e melodia; transição em barras musicais quando possível. Evitar trocar a faixa a cada inimigo. Crossfade com duração configurável e debounce de estados para prevenir oscilação.

## Engenharia de áudio
- Preferir Web Audio API com buses music, sfx, ui, ambience e master.
- Volume de cada bus persistido localmente; master limiter e headroom de mixagem.
- Desbloqueio de AudioContext apenas após interação do usuário, especialmente iOS Safari.
- Polyphony limit por evento, cooldown e variações aleatórias leves para disparos repetitivos.
- Posicionamento e atenuação em eventos de inimigos/foguetes quando tecnicamente viável.
- Pausar/suspender ao ocultar aba; não deixar loops órfãos após reset/transformação.
- Assets com licença documentada e orçamento de tamanho de download; testar performance mobile.
- Se asset falhar, fallback silencioso seguro sem bloquear gameplay.

## Gates de aceite
1. Preview de PR: smoke do carregamento, eventos básicos e volumes, sem exigir aceite estético.
2. DEV: disparos, foguetes, boost, transformação e reversão em desktop e celular.
3. HML: comparação antes/depois gravada; revisão com fones e alto-falante de celular; sem clipping, loops abruptos, mascaramento de alertas ou regressão de FPS.
4. PROD: CI completo + aceite humano de som e experiência. O áudio novo não pode ser promovido somente porque os eventos passaram nos testes.

## Sequência de implementação
S-02 transformação, S-03 foguetes, S-04 armas, S-05 motores; depois S-01 direção musical, S-06 adaptação, S-07 mixagem, S-08 feedback, S-09 testes e S-10 temas. Priorizar teste rápido de 30–60 segundos de gameplay em preview antes de produzir trilhas completas.
