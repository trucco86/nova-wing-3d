# Propulsão contínua do mecha — candidata Web 1.25.2

Continuação isolada da #69; não representa aceite visual ou promoção de ambiente.

## Resultado observável

- Ativar/soltar BOOST acelera/desacelera o rotor sem recalcular sua fase pelo tempo total da missão. A rotação nunca salta ou inverte por mudar o estado do impulso.
- O bocal aproxima-se suavemente da direção comandada, com amplitude limitada; a carcaça permanece fixa no alto das costas.
- Chamas principal e secundárias crescem a partir da saída do motor, sem recuar para dentro da carcaça ao aumentar o comprimento.
- A pose de braços/pernas usa o mesmo impulso efetivo para teclado e toque, inclusive quando a energia esgota. Não muda velocidade, dano, energia, hitbox, asas ou progressão.
- A animação recebe delta da simulação; delta zero congela propulsão. Em 30/60/120 atualizações por segundo, uma sequência de impulso com mesma duração termina na mesma fase e intensidade (tolerância numérica).

## Evidências e limites

Regressões em `tests/mecha-design.test.mjs`, integração teclado/toque no harness e capturas WebGL de `tests/browser/mecha-visual.spec.mjs`. Inspeção de mudança de direção/boost e FPS em aparelho físico continuam pendentes. Preservar o fluxo de revisão visual da #69 antes de DEV/HML/PROD.
