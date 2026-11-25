# Observador de física e perfis de jogador

Primeiro detector consultivo baseado em telemetria real da cidade. Implementa parte dos contratos NW-R001 e NW-R002 da [memória de regressões](GAMEPLAY-REGRESSION-MEMORY.md) e prepara a integração com as PRs #437 e #444.

## Detecção

- Centro da nave dentro de AABB ativa, acima de 0,25 unidade de profundidade por três amostras consecutivas: candidato P0, não confirmação de clipping da malha.
- Transparência incompatível com sinal de fade acima de 0,6 e opacidade acima de 0,95 por três amostras: candidato P1, não medição direta da oclusão na tela.
- Dados ausentes, inválidos, congelados ou sem sólidos ativos suficientes: BLOCKED, nunca aprovação.
- Valores iniciais de calibração; validar em cenários reais antes de ativar qualquer gate obrigatório. Colisões rápidas entre amostras, malhas rotacionadas, colisores de outros setores e bloqueios de navegação exigem detectores adicionais.

## Perfis e evidências

Cauteloso, explorador e adversarial usam sequências reproduzíveis de teclado ou joystick real em desktop e mobile. São scripts de direção, não jogadores autônomos de combate. O relógio determinístico amostra a cada 0,1 segundo simulado, não mede FPS físico. Registra comandos, posição, sólidos, opacidade, achados, SHA CI e captura final. A captura final não é imagem do instante do incidente; utilizar trace ou futura integração ao vídeo da PR #444.

```sh
node --test tests/gameplay-physics-observer.test.mjs tests/gameplay-player-profiles.test.mjs
npm run test:browser -- gameplay-physics-observer.spec.mjs
```

O navegador real ainda deve validar todos os seis roteiros. Achados são consultivos, erros do executor ou ausência de dados falham o teste. Não altera o runtime, o ranking, o build, regras de produção nem autorização humana.

## Próximo passo

Calibrar por classe física e adicionar telemetria com identidade de collider estável, detecção swept independente, imagem do evento, clipes por anomalia, visibilidade real de jogador/alvo, progressão e integração de relatórios ao Observer. Não declarar cobertura de toda a campanha com esta amostra.
