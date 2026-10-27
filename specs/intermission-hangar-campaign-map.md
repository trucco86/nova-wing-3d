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

## Integração v1.24.18

- Preservar órbita à esquerda acima do direcional e modo canhoto da v1.24.17.
- Textos novos disponíveis em português, inglês e espanhol, inclusive atributos acessíveis.
- Bônus de bomba na entrada de setor não duplica na retomada de checkpoint; nova campanha começa com três bombas como antes.
- Compras só no hangar, com saldo e teto válidos; pacote indisponível se não houver três vagas.
- Mapa congela gameplay e permite voltar ao hangar; reinício e saída escondem o mapa.

## Gates

- Harness: compras reais, limites, saldo insuficiente, tiro e cadência reais, pausa/reinício e checkpoint legado/novo.
- Playwright: fluxo hangar → mapa → hangar → próxima fase, PT/EN/ES, geometria e capturas em desktop e mobile.
- QA independente, CI no SHA final e publicação conforme autorização existente; teste físico não executado permanece pendente.
