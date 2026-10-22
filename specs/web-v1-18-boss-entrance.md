# v1.18 — Boss entrance telegraph

## Problema
Um chefe de estágio pode surgir sem preparação suficiente. O jogador precisa entender que um confronto importante está próximo antes da troca de música e de câmera.

## Critérios verificáveis
- Um aviso visual e sonoro curto aparece **antes** do início do boss, sem pausar a nave.
- Aparece apenas uma vez por fase, mesmo ao pausar e retornar; reiniciar fase redefine o aviso.
- Não invade centro da tela, não bloqueia botões nem aparece sobre arcade, hangar ou pausa modal.
- Boss, HP, vulnerabilidades, timings, saves, fases, diálogos e lógica de ataque ficam inalterados.
- Internacionalização PT/EN/ES e legibilidade em celular.
- Verificar com Node harness, browser e capturas reais, mantendo o gate de publicação.

## Limitações
Esta release não substitui a cinemática final com os modelos dos Five Cats, que segue NW-09 do backlog.
