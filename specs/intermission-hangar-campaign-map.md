# P1 — Hangar de armamentos e mapa de campanha entre fases

## Jornada
Após eliminar o chefe e concluir um setor, o piloto chega ao **hangar**. Ele investe créditos em armamento, múltiplos projéteis, cadência, blindagem, reparo, pods e bombas; ao selecionar **VER MAPA**, visualiza dez setores com concluídos, próximo e futuros. O mapa mostra título, missão, ameaças e chefe do setor seguinte. **INICIAR FASE** avança; **VOLTAR AO HANGAR** permite outras compras.

## Mecânicas contratadas
- MULTITIRO: dois níveis, +1 projétil por nível, teto bônus +2, disponível somente na Web (preserva tiros do nativo).
- NÚCLEO RÁPIDO: dois níveis, cada nível reduz em 12% o cooldown de tiro no modo Web.
- BOMBAS ×1 e PACOTE ×3: incrementam inventário, limitado a oito bombas Web; uso continua consumindo uma por acionamento.
- CANHÃO, POD ORBITAL, REPARO e BLINDAGEM preservam suas progressões atuais. Os valores dos botões refletem custo, créditos e estado máximo.
- Saves existentes versão 1 continuam compatíveis; upgrades `volley`, `rapid` e `bombs` são opcionais e validados antes de restaurar.
- Checkpoint do setor seguinte acompanha as compras; pausa, reinício e retomada continuam válidos.
- O mapa é informativo e não permite selecionar livremente setores bloqueados; o último chefe da campanha permanece Marvin.

## Gates
- Testes unitários de progressão da rota, upgrades, limites e checkpoint legado.
- Testes Playwright de loja, compra, ida/volta do mapa, continuidade até o setor seguinte e layout mobile/desktop.
- Preview isolado, nenhum merge HML/PROD antes da CI verde e aceite de jogabilidade/visual.
