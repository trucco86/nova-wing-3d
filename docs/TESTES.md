# Estratégia de testes

## Camadas

| Camada                               | Comando                | O que verifica                                      |
| ------------------------------------ | ---------------------- | --------------------------------------------------- |
| Lógica real com interfaces simuladas | `npm test`             | Movimento, recursos, combate e transições           |
| Geometria Three.js                   | `npm test`             | Coordenadas finitas, índices e compartilhamento     |
| Estrutura                            | `npm run check:repo`   | DOM, documentação, skills, CI e orçamento           |
| Artefato                             | `npm run build:check`  | HTML corresponde às fontes e dependências           |
| Navegador                            | `npm run test:browser` | Inicialização, entrada, HUD, pausa e falha de WebGL |

## Harness determinístico

`tests/harness.mjs` cria elementos com os IDs da interface e fornece relógio, eventos, áudio e renderer simulados. A função `createGame` é a mesma utilizada pela página. Aleatoriedade semeada permite repetir cenários. Os testes de combate usam encontros desativados quando precisam isolar uma regra; há um caso separado para geração de ondas.

A suíte inicial possui 19 testes de lógica e geometria. Cobre menu, início, teclas, limites, pausa, cadência, invulnerabilidade, rolamento, dano inválido, bombas, energia, perda de foco, cancelamento de toque, chefe, vitória, derrota, reinício e estabilidade por delta de tempo.

## Navegador

O Playwright define projetos desktop e mobile com toque. A CI instala Chromium e dependências, habilitando renderização por software. O teste coleta erros de página e console, inicia a missão, usa controles, verifica recursos, pausa e captura screenshot. Outro caso simula falta de WebGL e exige mensagem de erro útil.

Emulação de toque não substitui um celular físico. Screenshots são evidência para inspeção, não testes de comparação de pixels. Esta suíte não certifica desempenho, aparência em todos os monitores ou compatibilidade iOS.

## Executar

```sh
npm ci
npm run build
npm run validate
npx playwright install --with-deps chromium
npm run validate -- --browser
```

Se não houver WebGL disponível, registre o bloqueio. Não substitua o navegador por um renderer simulado para afirmar aprovação visual.

## Revisão manual antes de uma versão

- Conferir legibilidade do HUD e contraste durante explosões.
- Jogar até o chefe, vencer, perder e reiniciar.
- Verificar toque simultâneo, cancelamento e rotação da tela.
- Testar pausa ao alternar de janela e áudio após iniciar.
- Medir desempenho em um computador e celular identificados, se desempenho fizer parte da aceitação.
