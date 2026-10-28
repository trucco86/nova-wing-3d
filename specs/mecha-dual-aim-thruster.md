# Nova Wing — Mecha Dual Aim e propulsão reativa (vertical slice DEV)

Issues: #66 (rig/mecha), #123 (som/turbina) e #124 (duas mãos/lock).
Branch independente da candidata de órbita/capa/rank #122. Não alterar PROD.

## Mecânica implementada

- Forma nave: tiro frontal, boost e manobras existentes preservados.
- Forma robô: atira pela mão direita, origem real do projétil no punho; ombro e cotovelo articulados e recuo leve.
- LOCK por **N** no teclado ou toque no botão LOCK na área inferior de controle: a mão esquerda rastreia alvos vivos dentro de ~0,48 radianos do eixo frontal, até 250 unidades e sem bloqueio por obstáculo.
- Travamento por 0,8s de linha de visada; pulso físico de precisão parte do punho esquerdo, 10 de energia, recarga 2s; a colisão usual determina acerto real, sem aplicar dano remoto instantâneo.
- Contra chefes, só travar geradores expostos conforme regra de flanco/pontos fracos ou núcleo aberto após destruir geradores. Perder visibilidade limpa lock.
- Informações de LOCK somente no rail superior e uma pequena mira vinculada ao alvo, sem texto central. LOCK desaparece em modo nave.
- Turbinas acima da cintura e nas escápulas, com pivot orientável, animação de exaustão condicionada ao BOOST e ao movimento; duas camadas sintetizadas de áudio persistente iniciadas após gesto legítimo, compartilhando o AudioContext existente.
- Pausa, retorno ao menu, fim de fase e destroy silenciam ou liberam motor/lock. Sem rede/autorização externa.

## Critérios pendentes de homologação

- Comparação visual real do robô em 4 ângulos, mobile portrait e landscape, sem interseção braço/asa.
- Audição real do som, balanceamento vs música e SFX, sem clicks/fadiga, nos fones e no celular.
- Gameplay humano: aquisição de alvo e visualização dos weak points por trás/lado do chefe. Ajustar lock, cooldown e dano por playtest.
- FPS real e acessibilidade de controle em aparelhos de baixo desempenho.
- Integração de forma nave↔mecha ainda troca as malhas (efeito curto), uma transformação com painéis interpolados continua como trabalho específico de #66.

## Gates automáticos

- Tests unitários da geometria/posição, orientações independentes, lock e áudio lifecycle.
- Build estático, lint/format, browser desktop/mobile, regressão em boss/mission/performance.
- Preview isolado; sem merge HML e sem PROD antes dos gates e do aval visual do mantenedor.
