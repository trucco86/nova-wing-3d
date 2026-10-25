# Mecha v1.25.0 — critérios de homologação visual

Status: **candidata em DEV / PR #69; NÃO HOMOLOGADA**. Nenhuma promoção para HML/PROD.

## Escopo isolado

- Asas do mecha e da nave reutilizam o mesmo perfil geométrico, com escala-base controlada.
- Armadura facetada, canhões articulados e movimento alternado de braços/pernas.
- Rotor dorsal de cinco pás, com rotação dependente do tempo e chama responsiva ao boost.
- Neons adicionais no mecha e na nave por evolução nos níveis 0, 3 e 6.

## Evidências necessárias antes do merge

1. Capturas frontal, traseira e lateral do mecha em voo; comparar silhueta, detalhes, proporção das asas e posição da turbina com o conceito.
2. Capturas de nave e mecha nos níveis 0, 3 e 6; confirmar que os detalhes crescem sem prejudicar a leitura dos alvos.
3. Vídeo curto de transformação e disparo, com boost ligado/desligado; conferir braço, canhões, rotor e resposta da chama em movimento.
4. Desktop e mobile: verificar obstrução por HUD, visibilidade da mira, queda de FPS, taxa de quadros e controle por toque.
5. Regressão de nave e da campanha após transformação, incluindo pods e pintura selecionada.

## Gates automáticos

- `npm run validate` e `npm run build:check`; suíte unitária de rig/rotor/progressão.
- Playwright com captura de transformação e disparo, além dos shards regressivos.
- Conferência da versão `1.25.0` em pacote, lockfile, release notes, build web e projeto iOS.

O CI não substitui aprovação visual. **Aceite explícito do mantenedor** é obrigatório antes de integrar esta candidata ao DEV.
