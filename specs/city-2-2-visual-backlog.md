# Cidade das Máquinas 2.2 — Backlog e critérios de aceite

**Referência:** composição visual aprovada pelo usuário (avenida larga de placas metálicas, edifícios altos e densos, janelas ciano e âmbar, pontes elevadas, torres distantes e sinais luminosos). Não considerar uma simples imagem-conceito como execução já homologada.

**Ambientes:** branch isolada de Graphics 2.0, perfil Alto/Médio, **sem deploy em produção**. Manter compatibilidade WebGL/Three.js e preservar tiro, colisões, movimento, ranking e HUD.

| Prioridade | Entrega                                                                                  | Impacto visual | Risco FPS   | Aceite objetivo                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------- | -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P0.1       | Janelas densas, padrão ciano/âmbar, paredes laterais, módulos salientes e ritmo vertical | Muito alto     | Médio       | Alto mostra claramente mais fachadas/janelas que Médio; ambas as cidades acompanham loop/reset; zero geometria de colisão nova |
| P0.2       | Pontes, passarelas e ligações técnicas entre prédios                                     | Muito alto     | Médio       | Pelo menos três tipos de estruturas com leitura de profundidade; vão livre sobre a rota de voo; evitar atravessar inimigos     |
| P0.3       | Chão da avenida com placas, frisos, ranhuras, brilho e laterais                          | Alto           | Baixo–médio | Painéis e trilhos visíveis no primeiro plano, sem alterar colisão, trajetória ou leitura da nave                               |
| P0.4       | Densificar skyline com torres secundárias, topos e silhuetas assimétricas                | Alto           | Médio       | Três planos de profundidade distintos; reduzir padrão repetitivo por trecho                                                    |
| P1.1       | Luz atmosférica, reflexos e volumetria aproximada                                        | Muito alto     | Alto        | Sem excesso de bloom, HUD legível, frame-time aferido                                                                          |
| P1.2       | Tráfego aéreo, sinalização, fachadas animadas                                            | Alto           | Médio–alto  | Elementos com propósito visual, sem ruído que prejudique mira ou narrativa                                                     |
| P1.3       | Assets glTF/GLB PBR, texturas KTX2 e LOD para cidade e nave                              | Muito alto     | Alto        | LOD e memória medidos, fallback Médio, download inicial aceitável                                                              |

## Implementação P0.1 — código pronto para QA (homologação visual pendente)

- Preservar as janelas legadas no Médio; usar **quatro malhas instanciadas adicionais no Alto** (janelas frias, janelas âmbar, janelas de parede lateral e módulos blindados).
- Distribuir iluminação com lacunas determinísticas: nada de todas as torres com grades idênticas.
- Instâncias da frente e das laterais devem funcionar tanto no bloco próximo quanto no bloco distante (loop urbano), e sair de cena na subida orbital.
- Não adicionar colisores; não alterar trajetória, controles, tiro, Física ou balanceamento.
- Geração preferencial em menos de 12 draw calls por tile, mesmo com milhares de detalhes; medir antes de elevar densidade.
- Modos Médio e Alto devem ter identidade arquitetônica consistente; a diferença é densidade, não posição dos obstáculos.

## Implementação P0.2 + P0.3 — candidata integrada para QA

- **P0.2:** nove conexões aéreas com três perfis de ponte (skybridge, gantry e portal), dois corredores de trânsito suspenso nas laterais e suportes fora do corredor de jogo. Estruturas aéreas extras só em Alto; nunca geram colisão.
- **P0.3:** corrimãos de cinco peças ao longo de ambos os lados da avenida, com friso ciano de orientação. Corrimãos permanecem em **Médio e Alto** — o cenário não deve perder elementos estruturais na otimização.
- O piso usa shader de placas industriais 8×10, ranhuras, juntas e rebites com intensidade por qualidade; **Médio** mantém geometria/estética de pista, **Alto** adiciona textura fina e realces sem draw calls adicionais.
- Todas as estruturas instanciadas acompanham o loop de 1900 unidades e saem junto com a cidade na subida para órbita. Nenhum colisor foi adicionado.
- Critérios técnicos: verificações de instâncias por cidade, clearances de ponte e corrimão, alternância gráfica e integridade das duas cópias da cidade.
- **Limitações atuais:** sem texturas PBR reais, performance real de GPU e paridade com imagem-conceito ainda exigem inspeção humana.

## Gates antes de promover

1. Format/lint, build determinístico, validação unitária e testes Playwright (desktop + viewport mobile).
2. Screenshots comparativos **High/Medium** em 1366×768 e 844×390, incluindo aproximação do primeiro prédio e vista longitudinal da avenida.
3. Medir FPS, p95 de frame-time e memória estimada em máquina e celular reais; anotar GPU, aparelho e resolução (alvos iniciais: desktop 60 fps, mobile 30 fps; metas, não medições).
4. Teste de 3 ciclos da cidade, transição solo–órbita, morte/reinício, menus, inputs e chefão.
5. Aprovação visual humana contra imagem-conceito; não declarar 'premium final' apenas por cumprir testes automatizados.

## Linha de execução

- **Atual:** P0.1 + P0.2 + P0.3 codificados em candidata integrada para preview e QA.
- **Depois:** P0.4 (densidade/skyline), então iluminação, tráfego e assets premium, sujeitos ao aceite visual de P0.2/P0.3.
- Não promover para DEV/HML/PROD até conclusão dos gates e aceite explícito.
