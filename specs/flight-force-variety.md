# Voo, Force e identidade dos encontros

## Contratos

- Boost muda jatos cianos para laranja/branco, alonga a chama sem descolar do bocal e exibe rastros periféricos animados. Soltar, pausar e reiniciar não deixam o efeito preso.
- Anéis usam o mesmo limite horizontal da nave, com margem de 2 unidades. Resize reenquadra itens existentes. Coleta usa passagem varrida no eixo Z para funcionar no boost; aproximação a menos de 7 unidades atrai o item.
- V ou POD lança a formação de sua posição atual até 42 unidades à frente. Solta, mantém posição lateral no mundo; outro comando chama de volta com movimento contínuo. Acoplamento ocorre por proximidade, nunca teletransporte. Pods bloqueiam projéteis comuns por colisão varrida, mas não tornam a nave imune. Acoplados disparam com o jogador; soltos disparam automaticamente em leque. Evolução III mantém homing.
- Os dez chefes têm anatomias e padrões de ataque próprios. Cada setor tem um subchefe com nome, silhueta e ataque distintos. Mantêm-se geradores, orçamento de dano, pausa, progressão e cena final.

## Evidências

Testes do domínio cobrem boost/reset, limites e coleta em retrato/boost, lançamento/retorno/pausa dos pods e diversidade geométrica e de padrões. CI renderiza exemplares em desktop e mobile, além dos gates completos. Testes automatizados não substituem avaliação de dificuldade e ergonomia em aparelho físico.
