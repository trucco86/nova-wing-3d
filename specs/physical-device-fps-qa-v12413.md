# QA em aparelho físico — medição opt-in de FPS (v1.24.13)

## Objetivo

Tornar verificável o desempenho real no próprio celular do jogador, sem presumir que Playwright/Chromium no CI represente um iPhone/Android. A ferramenta só aparece **dentro do menu de pausa**, nunca no centro da nave, radar, HUD ou controles.

## Contrato funcional

1. **Controles** é a aba inicial da pausa. A aba **FPS / Desempenho** substitui o guia pela medição sem acrescentar informações à arena; ambas ficam lado a lado com CONTINUAR em landscape. Após iniciar a medição, a aba FPS permanece selecionada no retorno à pausa para facilitar leitura.
2. Pausa → "Diagnóstico de FPS" (recolhido por padrão) → "Iniciar medição" → continuar jogo por pelo menos 30 segundos → pausar → "Encerrar" → opcionalmente "Copiar relatório".
3. Medição começa somente após clique explícito do jogador; o amostrador observa o intervalo real entre callbacks `requestAnimationFrame` durante o estado `playing`. Nenhuma medição automática no menu, pausa, loja, cinematic, aba oculta ou minigame 2D.
4. Relatório inclui FPS médio, duração válida, p95 de frame em ms, quadros superiores a 33,34ms e a 50ms, tamanho do viewport, DPR e interrupções ignoradas.
5. Intervalos maiores que 1 segundo (troca de aba/suspensão pelo SO) não são contados como frames lentos. A retomada estabelece um novo ponto inicial. O buffer em memória tem no máximo 3.600 intervalos e descarta os mais antigos.
6. Não enviar, salvar ou registrar os dados em servidores, GitHub, analytics ou localStorage. O botão "Copiar" exige gesto explícito, usa Clipboard API e informa caso não exista permissão. Não ler user-agent, IP, localização ou identificadores privados.
7. Idiomas PT/EN/ES completos, sem afetar controles, combate, áudio, pausa, tamanho máximo do HTML ou fluxo de exit/restart. Ao iniciar uma nova missão, limpar medição antiga.
8. Os dados representam **cadência do navegador**, não tempo real de GPU, GPU load, temperatura, energia ou benchmark certificado. Cabe ao jogador comparar com a percepção visual, fluidez e aquecimento.

## Testes e evidências

- Node: períodos pausados, interrupções do sistema, buffer limitado, p95, quadros acima de 33/50 ms, internacionalização e ausência de identificadores no relatório.
- Playwright desktop/mobile: painel só na pausa, início/parada, nenhum FPS inventado no harness de tempo simulado, labels nos três idiomas e screenshots.
- Gates existentes: `npm ci`, `npm run format`, `npm run build`, `npm run validate`, `npm run validate -- --browser`.
- Homologação física: 30–60s de voo urbano e depois 30–60s de boss em portrait e landscape; registrar viewport, média/p95, toque e sensação de aquecimento. Não aprovar HML/PROD sem avaliação do jogador.

## Status

Candidata DEV preview, PR empilhada sobre #83. Não promove ambiente nem altera produção.
