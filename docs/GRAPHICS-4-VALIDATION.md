# Graphics 4.0 — roteiro de QA e comparação de fidelidade

**Versão candidata:** 1.27.28, PR #177. **Base:** Graphics 3.0, PR #176.
Não declarar homologação visual a partir de testes unitários.

## Ordem de validação

1. Abrir preview de PR #177, clicar PRESS START, ir a CENTRAL → OPÇÕES → GRÁFICOS → ALTO.
2. Entrar em HANGAR e inspecionar a NOVA-7, a Specter e a Aegis em frente, traseira, topo e 3/4.
3. Verificar carenagem com volume, asas chanfradas, canopy físico, naceles, iluminação e cores personalizadas.
4. Iniciar Cidade das Máquinas, pilotar por 30 segundos e transformar em robô. Verificar que o robô mantém as duas origens de tiro visíveis e que o novo tórax não invade mira ou HUD.
5. Mudar para MÉDIO e conferir que modelos hero desaparecem, preservando armas, vida, colisões e campanha. Reiniciar o jogo e confirmar a preferência e os saves.
6. Comparar capturas equivalentes em 1366×768, 844×390 e 390×844. Registrar FPS/frame-time real por 30 segundos nos modos Alto e Médio.
7. Conferir a renderização do Hangar 360° após mudança de idioma e da configuração de gráficos.

## Gates técnicos

- [ ] Build determinístico, format, lint, testes unitários e validate verdes no SHA final.
- [ ] Quatro shards Playwright verdes no SHA final.
- [ ] Source repair e Cloudflare preview verdes no SHA final.
- [ ] Homologação perceptiva do usuário com comparativo visual e medição real de FPS.

**Limitações:** este vertical slice é uma remodelagem geométrica procedural/PBR. A imagem-conceito requer assets autorais de alta densidade e bake, mapas de normal/roughness, HDRI/IBL, LOD e um passe completo de iluminação/VFX. Esta etapa não deve ser confundida com qualidade AAA concluída.
