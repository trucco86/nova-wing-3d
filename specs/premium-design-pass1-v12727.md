# Premium Design Pass 1 — v1.27.27 (candidata QA)

## Objetivo visual
Evoluir o Nova Wing no navegador para um padrão sci-fi premium, mantendo a legibilidade de rail shooter e a sensação de velocidade. A imagem conceitual de IA permanece referência — não deve ser apresentada como screenshot real.

## Contratos observáveis
- Nave NOVA-7, Aegis e Specter recebem placas de asa com relevo, encaixes de carbono, entradas de ar, acabamentos físicos PBR claros, anéis de motores e plumas duplas.
- O novo conjunto opcional `ship-premium-details` fica visível somente em **ALTO** e oculto em **MÉDIO**. Modo Automático continua resolvendo alto/médio pela política atual.
- Turbo animado acompanha boost: plumas ficam mais longas e mudam de ciano para laranja; retorno ao estado normal não modifica o dano nem o propulsor principal.
- A Cidade das Máquinas ganha torres monumentais e passarelas elevadas, instanciadas, além dos detalhes da v1.27.26, sem objetos cruzando a área jogável.
- O perfil Médio preserva o comportamento anterior, sem as novas chamadas de desenho para detalhes.
- Preservar inputs, HUD, hitboxes, physics, save, login, ranking, menu e progressão. Não trocar motor nem exigir instalação.

## Testes e limites
- `npm run release:prepare -- 1.27.27`, `npm run format`, `npm run build`, `npm run validate` e Playwright (desktop e mobile) no SHA final.
- Medir FPS e frame time real em dispositivos para ALTO e MÉDIO, revisar 1366×768, 844×390 e 390×844 e comparar imagens — screenshots de navegador, não arte gerada.
- Evitar mergulhar em alterações de gameplay, sombras dinâmicas caras ou texturas externas antes da homologação. O primeiro pacote não promete paridade gráfica com a imagem conceitual.
- Não promover DEV/HML/PROD sem revisão visual e técnica humana.
