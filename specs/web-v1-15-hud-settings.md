# Web v1.15 — UX de missão, pausa e opções

## Motivação e escopo

A tela mobile da v1.14 sobrepõe ao combate marca fixa, nome de setor,
radar e textos secundários. A próxima release prioriza integridade do escudo,
pontuação e comandos; preserva jogo, Five Cats, capa aprovada, hangar 360,
trilha, suprimentos, prólogo, chefes, progressão e checkpoints.

## Contrato de apresentação

- Marca do jogo é exibida na capa e escondida no gameplay.
- Nome e bloco do setor aparecem por três segundos no início da fase; a rota
  continua disponível; reduz movimento aplica transição instantânea.
- Radar tático só é exibido no encontro com chefe e tem formato compacto,
  sem cobrir escudo, pontuação nem os botões de toque.
- Contagem de itens de cuidado fica no resumo da pausa, não fixa sobre a cena.
- Modais são operáveis com botões de toque e teclado, inclusive em telas estreitas.

## Fluxos de pausa

- Pausa congela simulação/áudio, libera entradas de toque e abre um menu.
- Continuar retoma estado anterior (inclusive arcade, respawn ou colapso).
- Reiniciar requer confirmação e restaura os atributos/equipamentos, créditos,
  score e cuidados registrados na entrada do setor; descarta apenas a evolução
  obtida durante a tentativa atual.
- Sair requer confirmação, limpa a cena e retorna à capa; o checkpoint salvo
  anteriormente continua disponível, quando válido.
- Cancelar confirmações não altera progresso. Tecla Esc fecha confirmação
  antes de retomar a missão. Sair não grava um progresso incompleto.

## Opções

- Áudio com volumes independentes (geral, música, SFX); volume zero silencia.
  Configurações não podem ignorar o bloqueio de autoplay do navegador.
- Idioma inicial PT com textos dos novos menus em PT/EN/ES. Textos e nomes
  históricos da campanha continuam em português nesta entrega.
- Sensibilidade de stick entre 0.6 e 1.6, opacidade de comandos entre 0.4
  e 1.0, controles espelhados opcionais, vibração desligada por padrão.
- Legendas e intro automática podem ser desligadas; intro continua acessível
  pelo botão de assistir.
- Preferências independentes do checkpoint, persistidas localmente e validadas;
  armazenamento indisponível não impede jogar.

## Gates

Os testes verificam: título temporário, pausa congelada, confirmação, retorno
ao menu, reinício de setor, sanitização de preferências e input. Build deve
conter a nova versão no HTML; além dos testes unitários, CI executa browser
desktop/mobile e validação de layout após compilação, antes do deploy.
