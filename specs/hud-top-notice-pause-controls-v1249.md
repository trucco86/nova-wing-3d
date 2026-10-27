# P0 — Centro limpo, alertas superiores e manual de controles na pausa

## Contrato de UX

- A área central é exclusiva do gameplay (nave, cenário, inimigos, retículo e feedback de impacto conectado ao disparo). Nenhuma caixa com mensagem textual pode flutuar na mira ou atravessar o centro.
- Alertas de integridade abaixo de 45% até acima de 25% aparecem no topo em **amarelo piscante**. A partir de 25% aparecem em **vermelho piscante**, com prioridade visual.
- Alertas de ataque iminente ou reator instável aparecem em vermelho piscante. A aproximação de chefe usa amarelo piscante; mensagens de resultado/itens/comunicações são neutras.
- Mensagens textuais de missão, coleta, chefe e sistemas estão em uma rail superior compacta sem captura de toque. A rail limita a altura e respeita safe-area, desktop, portrait e landscape.
- Se o usuário escolher redução de movimento, manter cor/contraste e **desabilitar piscar**.
- Com menu de pausa aberto, o guia de controles aparece expandido e acessível por teclado; lista os comandos reais, inclusive T = transformação, V = pods, R = reparo e J/L = órbita.
- No mobile, o guia apresenta também nomes dos comandos de toque; PT/EN/ES trocam sem reiniciar o jogo. As ações CONTINUAR, REINICIAR, OPÇÕES e SAIR continuam priorizadas.
- Quando painel RPG expande no telefone, botões de orbitar não podem bloquear SCAN e demais ações. Validar sobreposição de alvos **interativos**, não do wrapper transparente de toque.

## Comandos desktop documentados (do código)

WASD / setas: movimento; Espaço: disparo; Shift: impulso; T: robô; V: pods; B/X: bomba; Q/E/Z: giro; J/L: órbita; C: câmera; F: trocar arma; H/G: selecionar e usar especial; I: scanner; K: precisão; R: reparo; U: rajada; P/Esc: pausa.

## Gates

- [ ] Format, build, ESLint, 170 testes unitários e invariantes reexecutados no SHA final.
- [ ] Desktop e mobile Playwright em shards, incluindo teste de posição da rail, piscadas e legenda do pause PT/EN/ES.
- [ ] Screenshots do topo normal, escudo baixo/amarelo, vida crítica/vermelho e menu de pausa; testar 390×844, 320×568, 844×390 e desktop.
- [ ] QA dos controles e scanner durante combate com chefe; FPS mobile real, acessibilidade e aceite visual.
- [ ] Integrar sequencialmente #71 → #72 → #75 → #77 → esta branch. Sem promoção direta a HML/PROD.
