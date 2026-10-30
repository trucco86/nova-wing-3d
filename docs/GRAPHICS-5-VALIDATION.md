# P0 Graphics 5.0 — Plano de validação visual e desempenho

**Commit de QA:** registrar o SHA do head da PR #178 em cada sessão. Versão 1.27.29, não promovida.

## Visuais: verificar o que realmente mudou

- [ ] No menu CENTRAL → OPÇÕES → GRÁFICOS → Alto, abrir o HANGAR 360°.
- [ ] Inspecionar NOVA-7, Specter e Aegis em 3/4, frente, topo e traseira: apenas **um casco**, sem partes da nave antiga atravessando a fuselagem; turbinas e luzes continuam visíveis.
- [ ] Comparar material metálico e cerâmico em luz forte/fraca: reflexos, painéis de microrelevo e rugosidade têm variação perceptível, sem efeito de pixelização.
- [ ] Iniciar Cidade das Máquinas, medir 30 segundos de gameplay no Alto, com mira, boost, tiros, rings e HUD.
- [ ] Alternar nave → robô → nave. As armas devem sair dos punhos; nenhum casco antigo ou peça da nave deve reaparecer sobre o robô.
- [ ] Reiniciar fase e avançar missão: visual Alto continua consistente.
- [ ] Alterar para Médio: recuperar o modelo base leve sem perder save, pontos, armas e idioma.
- [ ] Medir frame-time/FPS por 30 segundos em desktop 1366×768 e mobile landscape 844×390; repetir no Médio. Salvar relatório e screenshots com mesmo enquadramento.

## Gates QA

- [ ] Quality, 375+ testes unitários, Source Repair e 4/4 Playwright no SHA final.
- [ ] Preview Cloudflare isolado com código e bundle iguais ao head.
- [ ] O usuário aprovou legibilidade, proporções, mecha e qualidade física em dispositivos reais.
- [ ] Sem promover para DEV oficial, HML ou PROD sem todos os gates.

## Próximo ciclo P0 (não entregue nesta PR)

Substituir os cascos procedurais por modelos GLB autorais com topologia, UV, LODs, normal/ORM e texturas físicas de origem licenciada, detalhar nave-mãe e chefes, depois introduzir iluminação HDR/IBL e partículas cinematográficas com profiler WebGL.
