# P0 — Ritmo de missão, subchefe e dificuldade

## Contrato de experiência

- Todas as dez fases recebem aproximadamente 10–17% mais duração, sem mudar seu número, ordem, checkpoints e narrativa.
- A ascensão cidade–órbita na fase 1 continua subordinada ao boost: o usuário precisa esgotar a energia efetivamente, e a saída da atmosfera mantém seu percurso cinematográfico gradual. O tempo da fase não pode antecipar a órbita ou o chefe.
- Durante os seis segundos anteriores ao primeiro subchefe, enquanto ele existir e por um breve intervalo após sua chegada, não entram novas ondas de caças nem obstáculos. O jogador pode se concentrar em reconhecer seus ataques.
- Durante os nove primeiros segundos do subchefe 1, seus ataques são telegráficos e menos numerosos. A dificuldade volta a crescer durante o combate; os outros subchefes mantêm seus padrões.
- Options permite selecionar Fácil, Normal e Difícil. Normal é sempre a seleção de **início de sessão**; a alteração manual vale durante a sessão e não é gravada, diferentemente das outras preferências.
- Fácil: dano ao jogador 70%, frequência de caças/obstáculos reduzida e recarga adversária maior.
- Normal: dano padrão e ondas mais espaçadas; fase 1 apresenta menos caças simultâneos e menos obstáculos.
- Difícil: dano ao jogador 125%, frequência adversária maior, mais caças na primeira fase e recargas menores.
- Idiomas PT/EN/ES traduzem o nome da configuração e as três opções.

## Gates de aceite

- Testes para opções/default mesmo diante de armazenamento legado ou corrompido, persistência das demais preferências e alteração da dificuldade em Options.
- Testes de orçamento temporal das dez fases, janelas do subchefe e escala de frequência/dano.
- Teste no navegador (desktop e mobile) da ascensão usando BOOST até esgotar; nenhum planeta com a cidade; áudio, FPS, colisões, HUD e controles preservados.
- Testar dificuldade Fácil/Normal/Difícil no início do setor, no encontro com subchefe e após pausa/reinício, incluindo modo normal ao recarregar.
- CI verde no SHA final e homologação visual antes de qualquer promoção. Não confundir commit com validação.
