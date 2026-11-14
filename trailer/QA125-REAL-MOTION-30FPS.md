# Nova Wing QA125 | Trailer fiel à pilotagem real, mínimo 30 FPS

## Origem e fidelidade

Branch derivada da QA124, baseada na QA122 Cidade 4.3. O motor usado é o Three.js/WebGL real do jogo, executado pela fixture determinística. Nenhuma imagem externa/IA, movimento falso de câmera ou animação criada em edição.

## Correções solicitadas

- **30 FPS de captura nativa da simulação**: exatamente 1620 frames WebGL distintos para 54 segundos de gameplay, com um frame para cada 1/30 s do relógio do jogo. A saída final tem 60 segundos incluindo 6 segundos de encerramento. **Não há interpolação de frames no vídeo.**
- **Nave controlada**: keyboard handlers reais de A/D/W/S, ciclos de plasma (Space), boost (Shift), barrel roll (E), dash robô (Z) e órbita dos chefes (J/L), com coreografia por cena. A verificação exige deslocamento físico mensurável em pelo menos 7 de 12 cenas.
- **Asteroide legível**: correção seletiva de gama e exposição somente entre 31,5 e 36 s (o segmento do asteroide); mantém textura, sombra e identidade original.
- **Chefe preservado**: primeiro 0,7 s dos segmentos de boss sem manobras, destacando a entrada do chefe; depois mostra combate e órbita.
- **Formato YouTube**: saída 4K UHD (upscale da captura real 1920x1080), H264/AAC, 30 FPS. **Não afirmar que é captura 4K nativa ou que o jogo roda em tempo real a 30 FPS no runner SwiftShader**.

## Gates

- [ ] Executar a Action QA125 até MP4 real no SHA final
- [ ] Validar 1620 frames de gameplay + 6 segundos de encerramento, 12 cenas e movimento do jogador em pelo menos 7 cenas
- [ ] Validar FFprobe 3840x2160, 30 FPS, 60 segundos, áudio AAC
- [ ] Conferir visualmente combate, cockpit, Lua, asteroide clareado e continuidade dos cenários
- [ ] Para 60 FPS nativos em hardware real, capturar o jogo em uma máquina com GPU e medição de desempenho, sem interpolar quadros

Não realizar merge/deploy em DEV/HML/produção sem aprovação explícita.
