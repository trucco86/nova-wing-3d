# Consolidação P0 — subchefe urbano e HUD fora da mira (v1.24.11)

## Contrato da experiência

1. O subchefe não bloqueia indefinidamente a campanha: depois de 22 segundos de idade, foge visualmente durante quatro segundos e sai sem recompensa de derrota.
2. Na fase, concluir a ascensão exige BOOST real até esgotar e depois esperar atmosfera. A retirada do subchefe não ignora esse gate.
3. Os HPs do subchefe/chefe, alertas de integridade, pickups e labels de impacto ficam em áreas periféricas, fora do retículo/centro; não se sobrepõem a SCAN ou aos controles principais.
4. Depois da retirada, radar, luta com chefe e disparos continuam respondendo normalmente, sem congelar a nave. A contagem de créditos/XP não recebe bônus de kill pelo recuo.
5. Deve funcionar em 320×568, 390×844, 844×390, desktop e modos de acessibilidade. O jogador precisa inspecionar o preview antes de homologação.

## Evidências e riscos

- Unitários: estado de retirada e perfis dos dez subchefes, sem alterar outras fases.
- Browser: fluxo sem matar subchefe até recuo; screenshot em fuga e luta orbital; regressões de controls/HUD e pause.
- FPS e conforto tátil em hardware real pendentes. O dock de órbita à direita da PR #79 é outra candidata funcional que requer integração visual futura; não misturar sem retestar toda a matriz.

Gate: não promover para HML ou PROD até CI verde no SHA final, review das capturas, aceite e dependências unificadas.