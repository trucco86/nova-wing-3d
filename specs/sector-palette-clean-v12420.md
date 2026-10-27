# P0/P1 — Setores com paletas distintas e fronteira orbital coerente

## Escopo

Portar somente a evolução de iluminação da PR #90 sobre a candidata de armas v1.24.19, que incorpora os P0 mobile e mapa da campanha. **Não** incluir a antiga duração curta das missões, nem copiar o motor de ascensão da PR #90: a base atual possui `setLaunchAscent`, trânsito de altitude e horizonte terrestre mais recentes.

## Critérios de aceitação

- Cada um dos dez setores tem cores de céu e acento únicas. A cor muda efetivamente a cena, céu procedural, iluminação e névoa.
- Enquanto a cidade/porto está visível, o globo orbital de fundo permanece oculto; a Terra do primeiro setor aparece **somente depois** da saída urbana.
- O setor de destroços espaciais permite globo sem qualquer cidade, com continuidade do jogador.
- Manter durações mais longas, pistas do chefe, colisões e controles de órbita já homologados. Sem controle extra sobre o centro de gameplay.
- Qualidade estática, regressão Node de temas/cidade/Terra, 4 grupos de teste browser e capturas WebGL de todos os dez cenários em desktop/mobile.
- Capturas não substituem homologação visual humana em HML. Não promover a produção antes da inspeção de contraste e legibilidade.
