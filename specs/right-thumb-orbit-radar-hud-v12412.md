# Contrato P0 — dock de órbita e radar sem sobreposição (v1.24.12)

## Critérios verificáveis

1. O polegar direito alcança ORBITAR no combate com chefe, sem depender da nave ou do retículo: em portrait fica acima das seis ações; em landscape, à esquerda da grade de ações no rodapé.
2. Cada seta mede ao menos 60×60 px, recebe eventos reais de toque por `elementFromPoint` e produz movimento orbital real para os dois sentidos.
3. O dock não sobrepõe joystick, TIRO, BOOST, ROBÔ, BOMBA, GIRO ou PODS; o painel RPG expandido suspende seus hit targets e permite tocar SCAN/precisão/reparo.
4. O radar fica na zona superior direita, 48px, sem atingir HP do chefe, barra do subchefe, pontuação, avatar, câmera ou o centro do combate. Estados de batalha continuam visíveis no HUD de chefe.
5. Preferência de mão esquerda espelha as ações e dock e mantém analógico utilizável no lado oposto.
6. A integração não altera o BOOST obrigatório da ascensão, a retirada de 22s+4s do subchefe, colisões, vida, dano ou a mira no chefe.

## Matriz QA

- Testes Playwright 320×568 / 390×844 / 844×390 com screenshots e toque real sustentado dos dois botões de órbita.
- Contratos de posicionamento dos alertas, HP, radar e scanner, incluindo pausa e opções de acessibilidade.
- `npm ci`, `npm run format`, `npm run build`, `npm run validate`, `npm run validate -- --browser` no SHA final.
- Nenhuma aprovação de HML/PROD sem avaliação de UX e FPS em celular físico.
