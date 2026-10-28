# Five Cats — Formação e Supers

## Candidata isolada para preview (P1 / issue #126)

A primeira fase começa com uma **cena jogável de 5 s**: Bia lidera no centro, Jenifer e Bob nas primeiras alas, Christopher e Calvinho nos flancos externos. O gameplay só passa a contar o tempo da missão depois da separação. A seleção de piloto do jogador permanece intacta: apresentação do grupo é diferente do personagem controlado.

**Apoio por trecho da fase 1:** aliados não controlados entram em quatro janelas independentes aos 19–24s, 42–47s, 66–71s e 91–96s. Disparam mísseis/raios físicos fracos contra inimigos em combate, sem ocupar a tela continuamente.

**PLASMA TITAN (Y ou botão no HUD superior):** original; custo 75 de energia arcana, duração 2,5s, recarga 15s. Feixe 3D luminoso gigante com emissões de pulsos físicos a cada 0,14s. O visual é limitado pelas estruturas próximas, e o dano passa pelo pipeline comum de projéteis, obstáculos e blindagem. Sem teleporte de dano.

**FIVE CATS OVERDRIVE (O ou botão no HUD superior):** custo 90 arcana, 3,5s, recarga 30s. Aliados se reúnem ao redor da nave controlada e executam múltiplas rajadas convergentes; partes vulneráveis de chefes respeitadas, sem bypass de escudo.

Som: efeitos originais sintetizados, sem copiar música ou animação de franquias comerciais.

### Validação e limites
- **Automatizado:** identidade dos 5, Bia central/adiante, quatro janelas, dupla capacidade, custos e cooldown, projéteis e término de estados.
- **Pendente:** avaliação visual real em 390x844/844x390, clipping e ângulo de câmera, áudio em celular, balanceamento dos efeitos, interseção com alerta de BOOST e desempenho móvel.
- Integração exclusiva por PR na branch `hml`, **sem merge ou publicação em main/produção** sem aprovação visual e gates. PR #122 (órbita, capa/ranking) e #125 (mecha) permanecem isoladas.

### Evidências
PR e SHA versionados, logs de quality e browser 1–4; arquivos gerados em `index.html` pela CI antes do preview. A documentação não equivale à homologação.
