# Próxima release — transformação e identidade visual

Estado: **em desenvolvimento; não publicada nem homologada**.

## Escopo aprovado

- NW-24: alternância nave/robô durante o combate, modelo 3D, propulsores, ataque mais potente, agilidade reduzida, custo de energia, cooldown e transição animada.
- Controle de transformação por teclado e botão touch, sem sobreposição com direcional ou tiro.
- NW-29: paletas e iluminação específicas para os dez setores, maior luminosidade e contraste, sem perder a legibilidade de projéteis e pontos fracos.
- Preservar dados salvos, configurações, skins, equipamentos e progressão.
- Chefes: apenas ajustes de legibilidade seguros nesta release; redesign completo segue na onda seguinte.

## Dependências e gates

1. Integrar alterações de PR #52 e PR #51 numa única candidata, após resolver conflitos e revisar regressões.
2. Corrigir CI e versionamento de pacote, lockfile, projeto iOS, changelog e arquivo de release; regenerar `index.html` com build oficial.
3. Testes de transformação, cooldown, custo de energia, disparo, colisões, transição de fase, mobile touch e pausa.
4. Comparar capturas por setor e medir FPS desktop/mobile. Garantir contraste da mira, HUD e inimigos.
5. CI quality/browser verde no commit final, revisão e merge; confirmar GitHub Pages antes de anunciar publicação.
6. Homologação manual do usuário separada da aprovação automática.

## Evidências

- Protótipo de robô: https://github.com/trucco86/nova-wing-3d/pull/52
- Paletas e iluminação: https://github.com/trucco86/nova-wing-3d/pull/51
- Correção mobile/release anterior: https://github.com/trucco86/nova-wing-3d/pull/46

**Não considerar este documento confirmação de release.**
