# Web v1.17 — Feedback de dano e legibilidade dos chefes

## Problema
O Nova Wing já possui HUD de mira e efeitos de impacto. Contudo, disparos bloqueados e confirmados não são suficientemente diferenciados, e a indicação de ponto fraco nem sempre é compreensível durante o combate.

## Contratos
1. **Dano confirmado:** texto breve com quantidade de dano validada pelo simulador. Nenhum número fictício.
2. **Sem dano:** mensagem distinta, sem indicar que houve acerto efetivo. Para chefes, orientar a mudar ângulo — os geradores laterais continuam exigindo flanco.
3. **Ponto fraco:** sinal visual diferente para disparos em pontos fracos dos inimigos, sem modificar multiplicadores, HP ou cadência.
4. **Retículo:** confirmação localizada junto à mira; cor legível sobre fundos claros/escuros, sem bloquear ação.
5. **Suporte mobile:** estado do feedback não interfere em botões, pausa, câmera, nativos ou navegador sem WebGL.
6. **Internacionalização:** PT/EN/ES para todas as novas mensagens. Nomes próprios e dados de save intactos.
7. **Harness:** testes puros para classificador de impacto, testes WebGL/browser existentes e capturas de resultado. Não afirmar teste em hardware real sem gravação/evidência.

## Não escopo
- Rebalancear HP, alterar trajetória de projéteis, IA de inimigos, chefes ou inventário.
- Introdução cinematográfica e mecânicas RPG adicionais: continuam no backlog.

## Gates
`npm run format && npm run build && npm run validate -- --browser`, além de revisão visual antes de integração. A versão web deve ser versionada e sincronizada com metadados das plataformas sem publicar apps nativos.
