# Nova Wing — Fase 4: Devastador, missão de sabotagem industrial

**Decisão aprovada em 01/11/2026.** A nave-mãe é o objetivo destrutível. Não existe um chefe humanoide, nave genérica ou círculo no olho na conclusão da fase 4. Preservar as fases 1–3, o dash do robô, a nave de lado, o boost e a progressão dos Five Cats.

## 1. Objetivo e roteiro por tempo de missão

A duração principal da fase 4 é **88 s** na campanha atual; o trecho orbital interno continua até o jogador neutralizar todos os sistemas. Tempos de passagem são _objetivos de direção_, não cutscenes incontroláveis.

| Trecho                       | Relógio de missão    | Gameplay ativo                                                                       | Cenário / narrativa                                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| A — Abordagem                | 00:00–00:17          | Aproximar-se da nave-mãe, desviar de defesas, cruzar abertura física do hangar       | Exterior monumental com docas e armas visíveis; sem Júpiter                               |
| B — Hangar e manutenção      | 00:17–00:35          | Voar em corredores largos, desviar de drones, selecionar nave/robô                   | Caças estacionados, guindastes, braços, passarelas e depósitos                            |
| C — Fundição e armamento     | 00:35–01:00          | Enfrentar escoltas e evitar prensas, fornos, esteiras e equipamentos                 | Trens industriais, pistões, linhas de circuito, cabos e tubulações energizadas            |
| D — Resfriamento e propulsão | 01:00–01:28          | Sobreviver às defesas, chegar à câmara, reconhecer máquinas a destruir               | Bombas hidráulicas, trocadores de calor, turbinas, motores e telas de diagnóstico         |
| E — Núcleo 360°              | Após 01:28           | Orbitar manualmente a estrutura, destruir módulos por etapa; usar lock-on multi-alvo | Reator físico tridimensional: circuitos, refrigeração, motores e núcleo sem boss genérico |
| F — Escape                   | Após destruir núcleo | Acelerar pelo corredor de saída, ativar boost e sobreviver ao colapso                | Explosões sequenciadas, alarme, rádio dos Five Cats, fuga e warp                          |

## 2. Ordem de destruição do reator

| Ordem | Sistemas físicos                | Condição                                                  | Consequência                                        |
| ----- | ------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| 1     | 4 circuitos de energia          | Orbitá-los pelo ângulo real, atingir os módulos luminosos | A refrigeração entra em sobrecarga                  |
| 2     | 2 controladores de resfriamento | Circuitos desligados                                      | Motores perdem proteção térmica                     |
| 3     | 2 motores de propulsão          | Refrigeração neutralizada                                 | A nave-mãe para de avançar; blindagem final exposta |
| 4     | 1 núcleo central                | Todos os oito componentes destruídos                      | Colapso controlado + fase de escape                 |

A colisão é validada contra os meshes reais, não por proximidade de interface; apenas sistemas ativos aceitam dano. Sem tiros invisíveis do antigo chefe. A órbita 360° é controlada pelo jogador por J/L ou botões do radar no touch; NÃO há top-down inesperado nem troca dos eixos WASD.

## 3. Direção visual

- Paredes e pisos compostos por painéis industriais de metal escovado, não túneis vazios.
- Placas com trilhas energizadas e seriais de diagnóstico; tubos de refrigeração e conduítes físicos em laterais/teto.
- Pistões sincronizados, motores em rotação, fan blades, braços robóticos, braços de acoplamento e plataformas de manutenção.
- Escala por camadas: dutos próximos, fábricas no meio, sala do núcleo profundamente iluminada ao fundo.
- Pistas de estado: circuito azul -> superaquecido âmbar -> desligado; motores parados ao destruí-los; resfriamento com perda de brilho.
- Preservar centro da tela legível, HUD no topo e controles mobile na faixa inferior.
- Repetição de maquinaria decorativa deve usar geometria instanciada e materiais compartilhados. Medir draw calls, triângulos, p95 frame-time e FPS Alto/Médio.

## 4. Robô — multi-lock original de laser

**Nova interação:**

- Segurar **LOCK** começa o scanner de múltiplos alvos 3D em frente ao robô. Cada alvo vivo e visível recebe um marcador numerado, inclusive peças expostas da Devastador.
- Os alvos são adquiridos um a um, sem duplicatas e com validação de linha de visão.
- Evolução progressiva: **3 / 5 / 8 / 12** alvos. O custo de energia cresce com o número, com cooldown e proteção contra disparos sem alvo.
- Soltar LOCK dispara um feixe/projétil físico por alvo, com feedback visual de disparo independente e dano pesado. O tiro frontal da mão direita permanece disponível.
- Toque curto em LOCK continua ativando/desativando a antiga mira automática, sem desfazer o que já foi validado.
- Os marcadores são pequenos e não interceptam toque nem sobrepõem menus. Redução de movimento e proteção de desempenho devem ser respeitadas.
- O design é autoral; toma a _ideia geral de varrer múltiplos alvos_ como referência, sem copiar assets, efeitos, sons, nomes ou animações de jogos existentes.

## 5. Estado técnico e critérios de aceite

| Requisito                                                                  | Estado                                                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Modelo 3D novo com oito subsistemas destrutíveis + núcleo final            | Implementação em PR #239, QA                                           |
| Ordem circuitos -> resfriamento -> motores -> reator                       | Implementação em PR #239, QA                                           |
| Órbita controlada 360° e sem IA de chefe genérico                          | Implementação em PR #239, QA                                           |
| Corredores ricos em circuitos, acopladores e motores                       | Implementação ampliada em PR #239, QA                                  |
| Multi-lock por segurar/soltar com capacidade 3/5/8/12 e marcadores         | Implementação em PR #239, QA                                           |
| Modelo de colisão e dano com todos os tipos de armas, incluindo bombas     | **Testes end-to-end pendentes**                                        |
| Reação ambiental completa à perda de cada subsistema                       | **Pendente** — som, iluminação e colapso físico progressivo            |
| Saída com boost e diálogo de conclusão Five Cats                           | **Parcial** — colapso existente, roteiro cinematográfico novo pendente |
| Homologação visual comparativa (iPhone, Android, desktop, Alto/Médio)      | **Pendente**                                                           |
| CI Node + 4 shards Playwright, SHA do HTML sincronizado, preview integrado | **Em verificação; não marcar verde sem evidência**                     |
| DEV/HML/produção                                                           | **Não promovido**                                                      |

### Casos P0 do QA

1. Entrar na fase 4 em QA e verificar hangar, fundição, maquinário industrial, turbinas e núcleo.
2. Confirmar que nenhuma defesa genérica de chefe reaparece na câmara; apenas módulos e riscos ambientais.
3. Orbitando 360°, encontrar alvos frontais, laterais e traseiros e confirmar que não sofrem dano fora da etapa ou quando ocultos.
4. Destruir 4 circuitos: refrigeração libera; destruir 2 refrigeradores: motores liberam; destruir 2 motores: núcleo aparece.
5. Nave e robô conseguem atingir fisicamente os alvos com projéteis; feedback de dano não inventa acertos.
6. Robô no nível baixo trava até 3 alvos e no máximo 12; energia e cooldown respeitados, sem auto-disparar durante pressão longa.
7. Mobile: segurar LOCK com um dedo enquanto pilota com o outro; soltar atira; tap rápido usa modo legado.
8. Concluir núcleo e escapar sem perder checkpoint, salvar estado anterior ou dar rank fictício em QA.
9. Regressão das fases 1–3, boss fights 5–10, HUD e controles com navegador e aparelho real.
10. Gate de produção somente com build/4 shards/preview íntegros e aceite humano.

**Escopo fora desta onda:** kit Hiper Nova, quarto pod, fases 11–20, mundo aberto, câmeras aleatórias, novo chefe humanoide na Devastador.

## 6. Fuga cinematográfica — implementada em QA

A conclusão da missão não usa o boss convencional. Depois de destruir as oito unidades e o reator:

- **0–1,35 s:** Bia confirma o colapso do núcleo. Explosões industriais se propagam.
- **1,35–3,30 s:** Bob relata a perda em cascata dos sistemas, incluindo propulsão e suporte.
- **3,30–4,70 s:** Calvinho anuncia a rota de fuga. Destroços e tremores aumentam.
- **4,70–6,45 s:** Christopher solicita **BOOST**. Teclado Shift e botão touch funcionam, com energia de emergência para não bloquear o comando.
- **6,45–8,00 s:** Jenifer confirma a formação Five Cats e o hiperimpulso. Se o jogador não conseguiu acionar o boost, a assistência assume apenas a saída cinematográfica.
- **Após 8 s:** progresso e checkpoint originais preservados; retorno ao hangar/loja e preparação da missão seguinte.

A nave mantém controles e câmera ativos; nenhuma cutscene bloqueia o jogador. O efeito de velocidade usa sobreposição CSS sem interceptar toques, com `prefers-reduced-motion` respeitado. A versão anterior da fase 4 com boss e descarga de bateria **não deve reaparecer** na integração.

**Evidência de validação local em runner:** [workflow Source repair check 41350076274](https://github.com/trucco86/nova-wing-3d/actions/runs/41350076274) concluiu com **509 testes Node aprovados de 509**, formatação e `npm run validate` aprovados. O HTML foi sincronizado no commit `8d67a3c`. Ainda falta CI completo (Playwright quatro grupos), verificação real em celular e deploy final sob esse commit. Produção não alterada.
