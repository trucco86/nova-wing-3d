# Esquiva lateral do robô — substitui giro

## Decisão de produto (reafirmação)

No modo **nave**, `Q/E/Z` (ou toque curto no botão GIRO) mantém o giro de 360° que evita dano e limpa a areia de Marte após três voltas completas. Segurar o botão touch ainda inclina a nave a 90°.

No modo **robô**, o mesmo comando não gira o personagem: executa um **dash/esquiva horizontal na direção escolhida** com um impulso curto, pose inclinada e jatos laterais. Não transforma o robô em nave, não altera o giro orbital do chefe e não cria telas/HUD novos.

### Direção e controle

- **Desktop:** segurar A/← ou D/→ e pressionar Q, E ou Z executa o dash para a direção mantida; sem direcional, Q = esquerda, E = direita e Z = última direção (padrão direita).
- **Mobile:** empurrar o direcional virtual à esquerda ou à direita e tocar **DASH**. O movimento começa no `pointerdown`, sem exigir soltar o dedo; se o direcional estiver neutro, reutiliza a última direção. O botão passa de **GIRO** (nave) para **DASH** (robô); ajuda, atributos acessíveis e idiomas PT/EN/ES refletem o modo. Não confundir com BOOST ou o comando de orbitar.
- **Física:** deslocamento horizontal de 13 unidades ao longo de 0,24 s, calculado por delta e limitado ao corredor de voo. Continua passando pelos resolvedores existentes de parede, obstáculo e colisão varrida, sem teletransporte e sem atravessar cenários.
- **Combate:** invulnerabilidade somente durante os 0,24 s do dash; custo de 12 pontos de energia, recarga de 1,45 s e sem ativação se estiver colado à borda no sentido do dash. Não acumula imunidade com repetição, não dispara com energia insuficiente e não depende do cooldown do giro da nave.
- **Transições:** pausa congela o dash, sua recarga e o efeito; reinício, próxima fase e transformação cancelam a esquiva. Transformação bloqueada durante o dash para impedir estado híbrido.
- **VFX:** torso/robô inclinam suavemente para o lado da esquiva e jatos auxiliares contrapõem o impulso. Sem rotação de 360°, sem criar geometria, materiais ou partículas por frame.
- **Marte:** apenas giros completos da nave contam para a missão de limpar areia; esquivas do robô não alteram esse progresso. Se a tempestade terminar em modo robô, a mensagem orienta voltar à nave.

## Critérios de validação

1. Disparo de dash em esquerda/direita, joystick e teclas, no primeiro e no segundo acionamento após o cooldown.
2. Posição antes/depois consistente em 30 e 60 FPS, limites respeitados, sem atravessar paredes do asteroide.
3. Invulnerabilidade temporária termina com o dash; energia é debitada uma vez por ativação bem-sucedida.
4. Nave mantém giro/limpeza de Marte; robô nunca contabiliza giros.
5. Pausa e reinício não deixam imunidade, jatos ou cooldown residual; mobile mantém as áreas de toque e não cobre o campo de visão.
6. CI Node + Playwright desktop/mobile e revisão visual humana em QA. Nunca liberar produção sem aprovação.
