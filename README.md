# Nova Wing 3D — Five Cats

Uma campanha de combate aéreo em WebGL, feita para abrir no navegador. Pilote a NOVA-7 com Bia, Bob e Christopher, atravesse dez setores e enfrente as máquinas de Marvin. Cidade costeira, cinturão de asteroides, fortalezas orbitais, cristais e abismos têm cenários próprios.

[Jogar no GitHub Pages](https://trucco86.github.io/nova-wing-3d/) · [Projeto de referência](https://github.com/trucco86/nova-wing)

## Campanha

| Setor | Ambiente              | Chefe colossal   |
| ----- | --------------------- | ---------------- |
| 01    | Cidade das Máquinas   | Caça-líder ROK   |
| 02    | Distrito Portuário    | Nave-Ferrão      |
| 03    | Cinturão de Destroços | Perfurador       |
| 04    | Estação Órbita-9      | Fortaleza Órbita |
| 05    | Tempestade de Dados   | Fênix de Plasma  |
| 06    | Setor Congelado       | Colosso Glacial  |
| 07    | Núcleo Púrpura        | Colmeia Viva     |
| 08    | Grade de Batalha      | Couraçado Ômega  |
| 09    | Abismo de Órion       | Núcleo Bastião   |
| 10    | Trono de Marvin       | Imperador Marvin |

Cada setor apresenta ondas, subchefe, rival e chefe. Destrua os dois geradores vermelhos do chefe para expor o núcleo. Barragens frontais, espirais e barreiras são anunciadas na tela. O chefe acelera os ataques quando sua integridade fica baixa.

Entre setores, o hangar permite comprar canhões, blindagem, pods, reparos e bombas. Créditos vêm de inimigos, geradores e anéis. O checkpoint registra o próximo setor, créditos e melhorias neste navegador; continuar reinicia com três vidas e suprimentos básicos. Não há sincronização entre aparelhos.

Esta é uma adaptação 3D da temática e dos principais sistemas de Nova Wing. Não é uma reprodução integral do motor original nem um produto oficial Star Fox.

## Jogar

No computador, use teclado. No celular, use os controles de toque; paisagem oferece mais espaço. O navegador precisa oferecer WebGL. O jogador não precisa instalar Node ou qualquer aplicativo.

| Ação      | Teclado       |
| --------- | ------------- |
| Mover     | WASD ou setas |
| Atirar    | Espaço        |
| Rolamento | Q, E ou Z     |
| Bomba     | B ou X        |
| Acelerar  | Shift         |

Os botões na tela permitem iniciar e pausar. A campanha começa com três vidas, 100 de escudo e três bombas. Cada nave perdida troca o piloto: Bia → Bob → Christopher. Rolamentos oferecem proteção temporária. Acelerar consome energia, recuperada ao soltar. Anéis azuis elevam a arma até seis níveis; a cada três, chega um pod (máximo três). O terceiro conjunto usa tiros teleguiados; arma máxima com três pods oferece Escudo Ômega contra projéteis. Anéis dourados recuperam escudo. Bases-servidor nos dois primeiros setores fornecem suprimentos quando destruídas.

A música usa as dez composições do Nova Wing original e um tema de chefe, sintetizados por Web Audio. Os botões ♪ e SOM controlam música e efeitos separadamente. O áudio começa somente após clicar em iniciar; a música silencia na pausa.

## Desenvolvimento

Use Node.js 24 e Python 3 apenas se preferir os atalhos Python.

```sh
npm ci
npm run build
npm run dev
```

Abra http://127.0.0.1:4173. O servidor entrega o `index.html` gerado; após editar a fonte, execute novamente o build e recarregue a página.

```sh
npm run format
npm run validate
npm run validate -- --browser
```

O último comando exige Chromium instalado pelo Playwright (`npx playwright install chromium`) e um ambiente com WebGL. A CI instala as dependências do navegador. A validação padrão não afirma que o teste de navegador foi executado.

## Organização

| Caminho                            | Responsabilidade                                        |
| ---------------------------------- | ------------------------------------------------------- |
| `src/main.js`                      | Inicialização no navegador                              |
| `src/game.js`                      | Estado, controles, combate, missão e HUD                |
| `src/visuals.js`                   | Modelos, cenário, materiais e pós-processamento         |
| `src/shell.html`, `src/styles.css` | Interface e estilos                                     |
| `src/assets/`                      | Retrato da piloto                                       |
| `index.html`                       | Entrega gerada com código, estilo e imagem incorporados |
| `tools/`                           | Build, contexto, tarefas, invariantes e validação       |
| `tests/`                           | Testes de comportamento, geometria e navegador          |
| `specs/`                           | Objetivos e critérios de aceitação de alterações        |
| `skills/`                          | Procedimentos de trabalho por domínio                   |
| `.agents/skills/`                  | Links para descoberta das mesmas skills                 |
| `.github/`                         | CI, revisão e modelos de contribuição                   |

A organização materializa a estrutura modular descrita no README do Nova Wing. O código do jogo permanece próprio desta edição 3D: não substitui o jogo Canvas 2D de referência.

## Comandos

| Comando                                | Resultado                                               |
| -------------------------------------- | ------------------------------------------------------- |
| `npm run build`                        | Regera a entrega HTML                                   |
| `npm run build:check`                  | Falha se a entrega divergir da fonte                    |
| `npm run lint`                         | Verifica JavaScript                                     |
| `npm test`                             | Executa testes determinísticos sem GPU                  |
| `npm run test:browser`                 | Executa smoke tests desktop e toque                     |
| `npm run check:repo`                   | Verifica estrutura, links, skills e contratos           |
| `npm run validate`                     | Executa os gates locais e registra evidências           |
| `npm run agent:context -- graphics`    | Obtém contexto dirigido; veja o mapa para nomes válidos |
| `npm run agent:new -- minha-alteracao` | Cria especificação sem sobrescrever arquivo existente   |

## Trabalhar com agentes

Comece por [AGENTS.md](AGENTS.md). As skills cobrem gráficos, áudio, dinâmica, física e entrega. O [harness](docs/HARNESS.md) conecta contexto, especificação, ferramentas e gates executáveis. Ele não é um agente autônomo residente e não garante ausência de defeitos.

A CI executa os jobs `quality` e `browser`. O job `pages` publica apenas depois que ambos passam, usando somente HTML e licenças; fixtures de teste não são publicadas. Torná-los obrigatórios para merge depende da configuração de proteção de branch no GitHub; adicionar o YAML sozinho não ativa essa proteção.

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Aprendizados e decisões](docs/APRENDIZADOS.md)
- [Harness de agentes](docs/HARNESS.md)
- [Testes e limitações](docs/TESTES.md)
- [Publicação e recuperação](docs/PUBLICACAO.md)
- [Catálogo de skills](skills/README.md)
- [Histórico](CHANGELOG.md)
- [Créditos e licenças](THIRD_PARTY_NOTICES.md)

## Licença

MIT, conforme [LICENSE](LICENSE). Three.js mantém sua licença própria. A imagem de Bia foi gerada para este protótipo. A fonte Google Fonts é opcional e usa fallback local se a rede não estiver disponível.

### Atualização 1.1 — instalação industrial

Voo com paralaxe, comunicações translúcidas e controles móveis redesenhados. Setores terrestres incluem tanques, sentinelas gigantes, obstáculos industriais e combate no túnel com passagens alternadas. Os dez chefes combinam máquina e criatura. Consulte [a especificação e os critérios de validação](specs/flight-environments.md).

### Combate atualizado — 1.2

Chefes em três etapas e derrota cinematográfica, subchefe persistente, pods com três evoluções e anéis distintos: verde recupera escudo; azul evolui arma. Use V ou o botão de pods para destacar a formação. A trilha muda entre fase, subchefe, chefe, fúria, colapso e vitória. Veja [a especificação](specs/boss-spectacle.md) e [os testes](docs/TESTES.md).
