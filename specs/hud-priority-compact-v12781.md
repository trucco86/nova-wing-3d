# HUD com prioridade de atenção — Nova Wing 1.27.81 (QA)

## Problema observado
A tela atual acumula texto do rádio Five Cats, avisos físicos do chefe, saúde do boss, coletáveis e outras informações na mesma faixa. No mobile, tudo concorre com mira, pontos fracos e ataques; algumas frases são muito longas e repetidas.

## Proposta implementada
**Uma decisão por vez, sem ocultar instruções críticas.**
- P0 sobrevivência: ESCUDO CRÍTICO, subida orbital, ataque real do chefe.
- P1 tático: ESCUDO BAIXO, aproximação do chefe, instrução de voo/rádio.
- P2 contextual: evolução, falas ambientais, confirmação visual de acerto e coleta.
- Todos os níveis compartilham **uma única faixa visual**. CSS arbitra simultaneidade inclusive no desktop. O estado e a informação original continuam no DOM/aria, sem perda do registro para tecnologia assistiva.
- Rádio: frases reduzem para até 58 caracteres, priorizam a ação de defesa quando existente; duração 1,3s (contexto), 1,65s (ação) e 2,25s (urgência). Rádio repetido tem deduplicação; falas rotineiras respeitam intervalo mínimo 7,5s, instruções 3s, urgentes nunca aguardam o cooldown rotineiro.
- Ataques: mostrar nome físico e **um único verbo de defesa** (até 39 caracteres); quando radar informa setor seguro, deixar a linha de aviso vazia. Não repetir 'zona verde', 'plasma' e 'orbes arcanos' a cada rajada.
- Estado do chefe: apenas o próximo objetivo ('BATERIA ESQ. · FRACA', 'BLINDAGEM · ORBITE', 'NÚCLEO EXPOSTO'), até 36 caracteres e 1 linha. Descrição completa acessível em aria-label/title.
- Saúde: PT/EN/ES harmonizados com rótulos curtos; o aviso permanece enquanto o risco está ativo, independentemente de mensagens de menor prioridade.
- Entrada do chefe: 2,2s com 'CHEFE À FRENTE', preservando o efeito sonoro.
- No mobile, faixa de até 42px, sem empilhar linhas; boss HUD continua no lado direito, RPG e ORBITAR seguem acessíveis. Fontes mantidas legíveis, não simplesmente reduzidas.

## Critérios de aceite
1. Em uma janela de combate com múltiplos eventos, **exatamente um** aviso da faixa aparece: crítico > boost > ataque > escudo > boss > rádio > hit > coleta.
2. Ataques fortes continuam telegrafados, não desaparecem por causa do rádio e não mostram 'SEGURO' quando o radar indica perigo.
3. No boss Omega/Europa, o texto de ataque deve caber em 39 caracteres e o estado em 36; hitboxes, mira, radar e movimentação não mudam.
4. Textos maiores podem ser lidos por tecnologia assistiva e pelo atributo title.
5. 320×568, 390×844, 844×390 e desktop: a faixa não cobre controles/retícula/canhões e evita scroll.
6. Testes Node de cooldown/deduplicação/prioridades/abreviação; testes Playwright DOM real, orientação mobile, aria e arbitragem simultânea.
7. Regressão nas fases 1/2, fase 4, Europa/fase 6 e Saturno/Ômega/fase 8. **Nenhum merge em produção antes da homologação visual.**

## Fora do escopo
Não reorganizar o layout físico do RPG ou reduzir o acesso ao teste Berserk; [issue #271](https://github.com/trucco86/nova-wing-3d/issues/271) cuida disso em uma branch independente.
