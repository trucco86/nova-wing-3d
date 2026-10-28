# Áudio cinematográfico original — v1.26.0

## Direção pedida pelo mantenedor

Graves e percussão com peso, atmosfera tensa/misteriosa inspirada na sensação de Panzer Dragoon Saga. Composição e efeitos originais; sem copiar melodias ou gravações. Reduzir a sensação de minigame causada por bipes agudos e arpejos curtos.

## Comportamento observável

- Menu e dez setores com motivos originais mais espaçados, pads sustentados, subgrave com harmônicos audíveis em celular, tambores graves e percussão de ruído filtrado.
- Subchefe, chefe, fúria, colapso e vitória conservam transições próprias, com densidade e tensão diferentes.
- Transformação para robô e retorno à nave têm sequência mecânica própria: servo, trava metálica e impacto grave, disparados só quando a transformação é aceita.
- Turbina contínua com corpo grave e ar filtrado, reagindo suavemente ao voo/robô/BOOST. Ignição própria ao ativar impulso; não disparar o mesmo efeito a cada frame.
- Impacto na nave, tiro, plasma e explosão usam transientes/texturas distintos. Proteção, rolagem e pausa não devem disparar impacto falso.
- Nenhum áudio antes do gesto do jogador; reutilizar o AudioContext, respeitar volumes/mute, pausar imediatamente e liberar vozes/nós ao destruir.
- Camadas limitadas e buffers de ruído reutilizados; HTML público continua abaixo de 2 MB. Sem downloads de áudio em runtime.

## Evidências e limites

- Testes de eventos reais de transformação/impacto/BOOST, pausas, retomada, volumes, limites de vozes e descarte.
- OfflineAudioContext real no Chromium: renderizar música, efeitos, turbina e mix, verificar amostras finitas, silêncio de pausa/mute e pico sem clipping; medir energia grave com filtros, sem equiparar métricas a qualidade estética.
- Capturar WAVs de CI para audição comparativa. Não declarar audição humana, qualidade subjetiva ou desempenho físico sem execução.
- Candidata inclui Mecha/armas/paletas atuais para avaliação conjunta em preview. Produção exige fechar os gates da candidata e registrar seu estado real de homologação.
