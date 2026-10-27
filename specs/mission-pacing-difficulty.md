# P0 — Ritmo de missão, subchefe e dificuldade

## Contrato de experiência

- Todas as dez fases recebem aproximadamente 10–17% mais duração, sem mudar seu número, ordem, checkpoints e narrativa.
- A ascensão cidade–órbita na fase 1 continua subordinada ao boost: o usuário precisa esgotar a energia efetivamente, e a saída da atmosfera mantém seu percurso cinematográfico gradual. O tempo da fase não pode antecipar a órbita ou o chefe.
- Durante os seis segundos anteriores ao primeiro subchefe, e pelos nove segundos iniciais de seu encontro, não entram novas ondas de caças nem obstáculos. O jogador pode se concentrar em reconhecer seus ataques.
- Durante o BOOST e os 38 s de travessia da atmosfera, **não gerar novos obstáculos**, mesmo após o horizonte terrestre começar a ficar visível. Satélites, destroços e cargueiras só entram quando `orbitalLaunch.phase` for `orbit`; a cena de transição não deve ter estruturas gigantes próximas à câmera.
- Na fase 1, após o primeiro obstáculo introdutório (por volta dos 9 s), **não gerar outros obstáculos** dos 12 s até o fim da janela de abertura do subchefe (+9 s); isso permite que obstáculos antigos saiam do campo de visão e evita blocos grandes no enquadramento durante o encontro. Não suprimir obstáculos nas outras fases ou depois da janela. A base-servidor também aguarda o fim da janela inicial, evitando um bloco grande próximo à mira; depois do intervalo pode reaparecer normalmente.
- Durante os nove primeiros segundos do subchefe 1, seus ataques são telegráficos e menos numerosos. A dificuldade volta a crescer durante o combate; os outros subchefes mantêm seus padrões.
- Options permite selecionar Fácil, Normal e Difícil. Normal é sempre a seleção de **início de sessão**; a alteração manual vale durante a sessão e não é gravada, diferentemente das outras preferências.
- Fácil: dano ao jogador 70%, frequência de caças/obstáculos reduzida e recarga adversária maior.
- Normal: dano padrão e ondas mais espaçadas; fase 1 apresenta menos caças simultâneos e menos obstáculos.
- Difícil: dano ao jogador 125%, frequência adversária maior, mais caças na primeira fase e recargas menores.
- Idiomas PT/EN/ES traduzem o nome da configuração e as três opções.

- Na primeira fase Web, o subchefe urbano tem 22 s de combate e, caso sobreviva, uma retirada visível de 4 s: sai do corredor de mira, interrompe disparos e libera o bloqueio do chefe da fase. A retirada não concede créditos, XP ou pontuação de derrota; os outros setores e plataformas nativas permanecem sem essa regra.

## Gates de aceite

- Testes para opções/default mesmo diante de armazenamento legado ou corrompido, persistência das demais preferências e alteração da dificuldade em Options.
- Testes de orçamento temporal das dez fases, janelas do subchefe e escala de frequência/dano.
- Teste no navegador (desktop e mobile) da ascensão usando BOOST até esgotar; nenhum planeta com a cidade; áudio, FPS, colisões, HUD e controles preservados.
- Testar dificuldade Fácil/Normal/Difícil no início do setor, no encontro com subchefe e após pausa/reinício, incluindo modo normal ao recarregar.
- CI verde no SHA final e homologação visual antes de qualquer promoção. Não confundir commit com validação.
