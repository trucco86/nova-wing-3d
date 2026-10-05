# Contratos e rastreabilidade

Specs descrevem intenção e critérios observáveis; o comportamento executável precisa continuar consistente com elas. Ao mudar uma regra, revise também seu teste e a explicação pública. Use `npm run agent:new -- nome-da-mudanca` para iniciar um contrato sem sobrescrever arquivos.

| Spec                                            | Contrato principal                                       | Módulos                                              | Evidência                                            |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| [foundation](foundation.md)                     | Fonte, build e base do repositório                       | `tools/`, `src/main.js`                              | Invariantes, lint e build reproduzível               |
| [campaign](campaign.md)                         | Dez setores, loja, vidas e checkpoint                    | `campaign.js`, `game.js`                             | `tests/campaign.test.mjs`                            |
| [flight-environments](flight-environments.md)   | Câmera, toque, chão, obstáculos e túnel                  | `flight.js`, `encounters.js`                         | `tests/flight-environments.test.mjs`, capturas       |
| [boss-spectacle](boss-spectacle.md)             | Resistência do chefe, anéis, colapso e trilha            | `combat.js`, `equipment.js`, `finale.js`, `audio.js` | `tests/boss-spectacle.test.mjs`, áudio/renderização  |
| [flight-force-variety](flight-force-variety.md) | Boost, coleta alcançável, pods e identidade de encontros | `game.js`, `bosses.js`, `visuals.js`                 | `tests/flight-force-variety.test.mjs`, capturas      |
| [input-title-screen](input-title-screen.md)     | Tiro sem gestos nativos e capa simplificada              | `input.js`, `game.js`, HTML/CSS                      | `tests/input-title.test.mjs`, teclado/toque e layout |

As specs se complementam. A evolução de pods em `flight-force-variety` detalha o comportamento originalmente introduzido em `boss-spectacle`; a mudança mais recente precisa declarar o contrato alterado, sem deixar duas regras incompatíveis.

## Antes de encerrar uma mudança

- O problema e o resultado esperado estão claros?
- O teste reproduz o risco real ou apenas repete a implementação?
- A CI executou no commit final?
- Há evidência visual/sonora quando necessária?
- O README e a arquitetura descrevem o comportamento atual?
- Limitações, publicação e recuperação foram registradas?
