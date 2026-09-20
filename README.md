# Nova Wing 3D — Five Cats

Uma missão de combate aéreo em WebGL, feita para abrir no navegador. A piloto Bia atravessa uma cidade costeira sob ataque até enfrentar ROK. O cargueiro Marvin compõe o cenário. A direção visual combina água, prédios iluminados, lua fragmentada, propulsores e bloom.

[Jogar a versão publicada](https://aurora-flight-trucco.trucco67.chatgpt.site) · [Projeto de referência](https://github.com/trucco86/nova-wing)

Esta edição adapta a temática de Nova Wing para o protótipo 3D desenvolvido nesta conversa. Tem **uma fase**, com ondas de inimigos e chefe após aproximadamente 145 segundos. Não implementa as dez fases, loja, upgrades ou trilha musical do projeto de referência. Não é um produto oficial Star Fox e não inclui modelos ou texturas extraídos daquele jogo.

## Jogar

No computador, use teclado. No celular, use os controles de toque; paisagem oferece mais espaço. O navegador precisa oferecer WebGL. O jogador não precisa instalar Node ou qualquer aplicativo.

| Ação      | Teclado       |
| --------- | ------------- |
| Mover     | WASD ou setas |
| Atirar    | Espaço        |
| Rolamento | Q, E ou Z     |
| Bomba     | B ou X        |
| Acelerar  | Shift         |

Os botões na tela permitem iniciar e pausar. A missão começa com 100 de escudo e três bombas. Rolamentos oferecem proteção temporária. Acelerar consome energia, recuperada ao soltar. Acertos, derrota, vitória e reinício fazem parte do ciclo jogável.

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

A CI executa os jobs `quality` e `browser`. Torná-los obrigatórios para merge depende da configuração de proteção de branch no GitHub; adicionar o YAML sozinho não ativa essa proteção.

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
