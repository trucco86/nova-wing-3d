# P1 / #84 — Canhão de dispersão equipável

## Objetivo

Evoluir o arsenal do Nova Wing além de upgrades incrementais: um modo tático diferente, com compra, equipamento explícito, comportamento de tiro e economia própria. Este é o primeiro recorte do backlog #84; mísseis, laser perfurante e bombas especializadas permanecem pendentes.

## Contrato funcional

- Disponível **somente no gameplay Web**, adquirido por **420 CR** no hangar da v1.24.18.
- Compra única desbloqueia o canhão, mas **não equipa automaticamente**. O piloto escolhe PULSO (longa distância) ou DISPERSÃO (curta distância) antes da próxima fase.
- Dispersão dispara **cinco pellets reais**, simétricos, com velocidades laterais [-24, -12, 0, 12, 24] unidades/s, curta duração, material âmbar e intervalo de disparo 35% maior.
- O dano por pellet cai de **46%** do disparo normal à queima-roupa para no mínimo **18%** a longo alcance; a dispersão desestimula rajadas distantes.
- O botão de equipar aparece apenas no hangar. **Nenhum comando adicional ocupa o centro do gameplay**.
- Os campos scatterOwned e fireMode são opcionais no save v1. Dados legados usam PULSO; modo DISPERSÃO sem compra comprovada nunca é restaurado.
- Em Android/iOS nativos, a nova compra e o equipamento são ocultos e o comportamento de tiro original é mantido.

## Gates antes de promoção

1. Testes de simetria/falloff e validação de save; testes integrados do combate, economia e reinício.
2. Playwright desktop/mobile (compra → equipamento → mapa → próxima fase → cinco pellets) com screenshots.
3. Quality e quatro shards Playwright no SHA final, index.html reproduzível.
4. Balanceamento em setores reais, efeitos sonoros diferenciados, legibilidade e FPS em aparelho físico.
5. Primeiro DEV, depois HML para aceitação. **Sem publicação em PROD nem homologação presumida.**

## Próximas especializações (#84)

Mísseis teleguiados com lock-on visível, laser perfurante carregável e bombas EMP/fragmentação/perseguidoras com munição e cooldown próprios.
