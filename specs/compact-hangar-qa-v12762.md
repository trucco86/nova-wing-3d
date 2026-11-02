# Nova Wing v1.27.62 — Hangar compacto e QA recolhido (produção isolada)

## Escopo da promoção

Port somente da UX aprovada no preview #254 para main (1.27.61). Não inclui Fênix/Europa/Berserk nem qualquer uma das demais evoluções de gameplay dos PRs empilhados.

## Contratos de navegação

- HANGAR abre na aba PILOTOS, cinco opções imediatamente acessíveis. NAVES mostra modelos e cores. ARSENAL mostra galeria de upgrades sob controle do jogador.
- Preview 360° fica junto da seleção pertinente, lado a lado no desktop e depois da fileira de escolhas no mobile; a troca de aba não apaga seleções ou save.
- TESTAR FASES · QA abre sua própria tela fechada. O usuário precisa acionar o summary para escolher fase/encontro. Continua escondido em hospedagem sem autorização para QA.
- Os cards da CENTRAL fecham quando a tela é reaberta. Escape, voltar, áudio, opções e login continuam funcionais.
- PT/EN/ES inclui os novos controles; sem regressão de toque ou teclado.

## Gates

- npm run release:prepare -- 1.27.62; format, build, validate; browser completo (quatro shards) no SHA final e QA visual.
- Deploy de produção somente a partir de main protegida; verificar SHA/version/URL publicados.
- Rollback via commit anterior de main e workflow Pages.
